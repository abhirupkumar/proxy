import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const supportedDeploymentEvents = ['deployment.canceled', 'deployment.error', 'deployment.promoted', 'deployment.succeeded']

export async function POST(req: NextRequest) {
    try {
        const { type, payload } = await req.json();
        console.log("Webhook Event Type: ", type);

        // Handle the webhook event
        if (supportedDeploymentEvents.includes(type)) {
            try {
                let data: { status: string; url?: string, meta?: JSON } = {
                    status: type.replace('deployment.', "").toUpperCase(),
                }
                if (payload.deployment.url) {
                    data.url = payload.deployment.url
                }
                if (payload.deployment.meta) {
                    data.meta = payload.deployment.meta
                }
                await db.vercelDeployment.update({
                    where: {
                        deploymentId: payload.deployment.id
                    },
                    data: data
                })
            }
            catch (error: any) {
                return NextResponse.json({ message: 'Bad Request' }, { status: 401 });
            }
        }

        return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
}

export const runtime = "edge";