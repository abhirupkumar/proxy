'use server'

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

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
        console.error(`Failed to resolve URL: ${relativeUrl}`);
        return relativeUrl;
    }
}

type ScraperResult = {
    url: string;
    colors: string[];
    images: string[];
    html: string;
    css: string;
    urlArray: { url: string; isOpenInNewTab: boolean }[];
    error?: undefined;
} | {
    error: string;
    details: string;
};

export async function scrapeWebsite(targetUrl: string): Promise<ScraperResult> {
    if (!targetUrl) {
        return {
            error: 'URL parameter is required',
            details: 'Please provide a URL to scrape'
        };
    }

    let browser;
    try {
        // Launch a headless browser
        browser = await puppeteer.launch({
            headless: true, // Use new headless mode for Puppeteer
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Collect all CSS
        let cssRules: string[] = [];

        // Intercept all CSS requests
        await page.setRequestInterception(true);
        page.on('request', request => {
            request.continue();
        });

        page.on('response', async response => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('text/css')) {
                try {
                    const cssText = await response.text();
                    cssRules.push(cssText);
                } catch (error) {
                    console.error(`Failed to extract CSS from ${url}`);
                }
            }
        });

        // Navigate to the URL and wait for content to load
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // For dynamic sites like Spotify, wait a bit longer and for specific content
        if (targetUrl.includes('spotify.com')) {
            try {
                // Wait for specific Spotify elements (adjust selectors based on Spotify's structure)
                await page.waitForSelector('.Root__main-view', { timeout: 10000 });
            } catch (error) {
                console.log('Could not find Spotify-specific elements, proceeding with what we have');
            }
        }

        // Get inline CSS
        const inlineCSS = await page.evaluate(() => {
            let styles = '';
            document.querySelectorAll('style').forEach(style => {
                styles += style.innerHTML;
            });
            return styles;
        });
        cssRules.push(inlineCSS);

        // Get the fully rendered HTML
        const html = await page.content();
        const $ = cheerio.load(html);

        // Extract body HTML
        const bodyHtml = $('body').html() || '';

        // Combine all CSS
        const combinedCSS = cssRules.join('\n');

        // Extract colors from CSS
        const colors = extractColorsFromCSS(combinedCSS);

        // Extract images
        const images: string[] = [];

        // Get images from <img> tags
        const imgSrcs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('img'))
                .map(img => img.src)
                .filter(src => src); // Filter out empty sources
        });

        // Get background images
        const bgImages = await page.evaluate(() => {
            const bgImgUrls: string[] = [];

            // Helper to extract URL from background-image style
            const extractUrlFromStyle = (style: string) => {
                const match = style.match(/url\(['"]?(.*?)['"]?\)/i);
                return match ? match[1] : null;
            };

            // Scan all elements for background images
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                const backgroundImage = style.backgroundImage;

                if (backgroundImage && backgroundImage !== 'none') {
                    const url = extractUrlFromStyle(backgroundImage);
                    if (url && !url.startsWith('data:')) {
                        bgImgUrls.push(url);
                    }
                }
            });

            return bgImgUrls;
        });

        // Combine and resolve all image URLs
        [...imgSrcs, ...bgImages].forEach(src => {
            const resolvedSrc = resolveUrl(targetUrl, src);
            if (resolvedSrc && !images.includes(resolvedSrc)) {
                images.push(resolvedSrc);
            }
        });

        // Extract link URLs - use Puppeteer's evaluation
        const urlArray = await page.evaluate((baseUrl) => {
            return Array.from(document.querySelectorAll('a')).map(a => {
                let href = a.href;
                // Resolve relative URLs
                if (href && !href.startsWith('http') && !href.startsWith('data:') && !href.startsWith('#')) {
                    try {
                        href = new URL(href, baseUrl).toString();
                    } catch (e) {
                        // Keep original if URL construction fails
                    }
                }

                return {
                    url: href || '',
                    isOpenInNewTab: a.target === '_blank'
                };
            });
        }, targetUrl);

        return {
            url: targetUrl,
            colors,
            images,
            html: bodyHtml,
            css: combinedCSS,
            urlArray
        };

    } catch (error) {
        console.error('Scraping error:', error);
        return {
            error: 'Failed to scrape the website',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    } finally {
        if (browser) await browser.close();
    }
}