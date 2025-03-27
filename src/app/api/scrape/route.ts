import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({
            error: 'URL parameter is required'
        }, { status: 400 });
    }

    try {
        // Fetch the webpage
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract body HTML
        const bodyHtml = $('body').html() || '';

        // Collect all CSS sources
        const cssRules: string[] = [];

        // Inline styles
        $('style').each((_, element) => {
            cssRules.push($(element).html() || '');
        });

        // External stylesheets
        const stylesheetPromises = $('link[rel="stylesheet"]').map(async (_, element) => {
            const href = $(element).attr('href');
            if (href) {
                try {
                    const fullUrl = href.startsWith('http')
                        ? href
                        : `${new URL(targetUrl).origin}${href.startsWith('/') ? href : `/${href}`}`;

                    const stylesheetResponse = await axios.get(fullUrl);
                    return stylesheetResponse.data;
                } catch (error) {
                    console.error(`Could not fetch stylesheet: ${href}`);
                    return '';
                }
            }
            return '';
        }).get();

        // Wait for all stylesheet fetches
        const externalStylesheets = await Promise.all(stylesheetPromises);
        cssRules.push(...externalStylesheets);

        // Combine all CSS
        const combinedCSS = cssRules.join('\n');

        // Extract colors from CSS
        const colors = extractColorsFromCSS(combinedCSS);

        // Extract images
        const images: string[] = [];
        $('img').each((_, element) => {
            console.log(element)
            const src = $(element).attr('src');
            if (src) {
                images.push(
                    src.startsWith('http') ? src : `${new URL(targetUrl).origin}${src}`
                );
            }
        });

        // Extract link URLs
        const urlArray = $('a').map((_, element) => ({
            url: $(element).attr('href') || '',
            isOpenInNewTab: $(element).attr('target') === '_blank'
        })).get();

        return NextResponse.json({
            url: targetUrl,
            colors,
            images,
            html: bodyHtml,
            css: combinedCSS,
            urlArray
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({
            error: 'Failed to scrape the website',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Ensures this route uses dynamic rendering
export const dynamic = 'force-dynamic';