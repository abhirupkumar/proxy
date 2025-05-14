"use server";

import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { db } from './db';
import ImageKit from 'imagekit';

import { v4 as uuidv4 } from 'uuid';
import { env } from 'env';

// Define a response type for our upload
type UploadResponse = {
    success: boolean;
    fileId?: string;
    url?: string;
    error?: string;
};

const imagekit = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT || ''
});

// Function to extract unique colors from CSS
function extractColorsFromCSS(css: string): string[] {
    const colorRegex = /(?:#(?:[0-9a-fA-F]{3}){1,2})|(?:rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))|(?:rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\))|(?:hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\))|(?:hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\))|(?:transparent)|(?:currentColor)|(?:\b(?:red|blue|green|yellow|orange|purple|pink|black|white|gray|cyan|magenta)\b)/gi;

    const colors = new Set<string>();
    const matches = css.match(colorRegex);

    if (matches) {
        matches.forEach(color => {
            // Normalize color representation
            const normalizedColor = color.toLowerCase().trim();
            colors.add(normalizedColor);
        });
    }

    return Array.from(colors);
}

// Function to resolve relative URLs
function resolveUrl(baseUrl: string, relativeUrl: string | undefined): string {
    if (!relativeUrl) return '';

    try {
        // Handle data URLs and absolute URLs
        if (relativeUrl.startsWith('data:') || relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
        }

        const base = new URL(baseUrl);

        // Handle protocol-relative URLs
        if (relativeUrl.startsWith('//')) {
            return `${base.protocol}${relativeUrl}`;
        }

        // Resolve other relative URLs
        return new URL(relativeUrl, base).toString();
    } catch (error) {
        console.error(`Failed to resolve URL: ${relativeUrl}`, error);
        return relativeUrl;
    }
}

export const scrapeFromUrl = async (targetUrl: string, text: string, workspaceId: string) => {
    if (!targetUrl) {
        return {
            error: 'URL parameter is required'
        };
    }

    let browser;
    try {
        // Launch a headless browser
        browser = await puppeteer.launch({
            headless: true,  // Use the new headless mode
        });
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({ width: 1280, height: 800 });

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Navigate to the page
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',  // Wait until the network is idle (no more than 2 connections for at least 500ms)
            timeout: 20000,
        });

        // Get the page content
        const html = await page.content();
        const $ = cheerio.load(html);

        // Extract body HTML
        const bodyHtml = $('body').html() || '';

        // Collect all CSS from the page
        const cssRules: string[] = [];

        // Get inline styles
        $('style').each((_, element) => {
            cssRules.push($(element).html() || '');
        });

        // Extract all stylesheet URLs
        const stylesheetUrls: string[] = [];
        $('link[rel="stylesheet"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = resolveUrl(targetUrl, href);
                if (fullUrl) {
                    stylesheetUrls.push(fullUrl);
                }
            }
        });

        // Fetch all external stylesheets
        const externalStylesheets: string[] = [];

        for (const url of stylesheetUrls) {
            try {
                // Create a new page for each stylesheet to avoid CORS issues
                const cssPage = await browser.newPage();
                await cssPage.goto(url, { waitUntil: 'networkidle2' });
                const cssContent = await cssPage.content();

                // Extract just the CSS content
                const cssMatch = cssContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
                if (cssMatch && cssMatch[1]) {
                    externalStylesheets.push(cssMatch[1]);
                } else {
                    // If not wrapped in pre tags, try to get raw content
                    externalStylesheets.push(cssContent);
                }

                await cssPage.close();
            } catch (error) {
                console.error(`Could not fetch stylesheet: ${url}`);
            }
        }

        cssRules.push(...externalStylesheets);

        // Get all computed styles for elements
        const computedStyles = await page.evaluate(() => {
            const styleSheets = Array.from(document.styleSheets);
            let cssText = '';

            styleSheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules);
                    rules.forEach(rule => {
                        cssText += rule.cssText + '\n';
                    });
                } catch (e) {
                    // Skip cross-origin stylesheets that can't be accessed
                    console.log('Could not access stylesheet rules');
                }
            });

            return cssText;
        });

        cssRules.push(computedStyles);

        // Combine all CSS
        const combinedCSS = cssRules.join('\n');

        // Extract colors from CSS
        const colors = extractColorsFromCSS(combinedCSS);

        // Extract images
        const images: string[] = [];
        $('img').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                const resolvedSrc = resolveUrl(targetUrl, src);
                if (resolvedSrc) {
                    images.push(resolvedSrc);
                }
            }
        });

        // Extract background images from computed styles
        const backgroundImages = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const bgImages: string[] = [];

            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const backgroundImage = style.backgroundImage;

                if (backgroundImage && backgroundImage !== 'none') {
                    // Extract URL from the background-image
                    const match = backgroundImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
                    if (match && match[1]) {
                        bgImages.push(match[1]);
                    }
                }
            });

            return bgImages;
        });

        // Resolve and add background images
        backgroundImages.forEach(bgImg => {
            const resolvedBgImg = resolveUrl(targetUrl, bgImg);
            if (resolvedBgImg) {
                images.push(resolvedBgImg);
            }
        });

        // Extract link URLs
        const urlArray = $('a').map((_, element) => {
            const href = $(element).attr('href');
            return {
                url: href ? resolveUrl(targetUrl, href) : '',
                isOpenInNewTab: $(element).attr('target') === '_blank'
            };
        }).get();

        await db.message.updateMany({
            where: {
                workspaceId,
                content: text,
                url: targetUrl
            },
            data: {
                urlScrapedData: {
                    url: targetUrl,
                    colors,
                    images,
                    html: bodyHtml,
                    css: combinedCSS,
                    urlArray
                }
            }
        });

        return {
            success: true
        };
    } catch (error) {
        console.error('Scraping error:', error);
        return {
            error: 'Failed to scrape the website',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    } finally {
        // Always close the browser
        if (browser) {
            await browser.close();
        }
    }
}

export async function uploadImage(formData: FormData): Promise<UploadResponse> {
    try {
        const file = formData.get('image') as File;

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Create a buffer from the file
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate a unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

        // Upload the file to ImageKit
        const result = await imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: '/proxy-studio/',
            useUniqueFileName: true,
        });

        // Return the URL of the uploaded image
        return {
            success: true,
            fileId: result.fileId, // This is the unique ID of the uploaded file
            url: result.url // This is the URL to access the image
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function deleteImage(fileId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Extract the file ID from the URL if a full URL was provided
        // ImageKit file IDs are typically at the end of the URL path after the last '/'
        let extractedFileId = fileId;
        if (fileId.includes('/')) {
            extractedFileId = fileId.split('/').pop() || '';

            // If the URL contains a transformation, we need to get the base file ID
            if (extractedFileId.includes('?')) {
                extractedFileId = extractedFileId.split('?')[0];
            }
        }

        // If we still don't have a valid fileId, return an error
        if (!extractedFileId) {
            return {
                success: false,
                error: 'Invalid file ID'
            };
        }

        // Delete the file from ImageKit
        await imagekit.deleteFile(extractedFileId);

        return { success: true };
    } catch (error: any) {
        const trimStr = (str: string) => {
            if (str.length > 200)
                return str.substring(0, 200) + "...";
            return str;
        }
        console.log('Error deleting file from ImageKit:', trimStr((error as Error).message));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}