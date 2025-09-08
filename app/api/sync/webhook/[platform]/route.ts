import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform
    const body = await request.json()

    // Verify webhook signature if available
    const signature = request.headers.get('x-webhook-signature') || 
                     request.headers.get('x-webflow-signature')
    
    if (signature && !verifyWebhookSignature(body, signature, platform)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    // Process webhook based on platform
    switch (platform) {
      case 'webflow':
        return await handleWebflowWebhook(body)
      case 'wordpress':
        return await handleWordPressWebhook(body)
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

  } catch (error) {
    console.error(`Error processing ${params.platform} webhook:`, error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handleWebflowWebhook(payload: any) {
  const { type, data } = payload

  try {
    switch (type) {
      case 'collection_item_created':
      case 'collection_item_changed':
        await handleWebflowItemChange(data, type)
        break
      case 'collection_item_deleted':
        await handleWebflowItemDeletion(data)
        break
      case 'site_publish':
        await handleWebflowSitePublish(data)
        break
      default:
        console.log(`Unhandled Webflow webhook type: ${type}`)
    }

    return NextResponse.json({ success: true, processed: type })
  } catch (error) {
    console.error('Error handling Webflow webhook:', error)
    throw error
  }
}

async function handleWebflowItemChange(data: any, eventType: string) {
  const { site, collection, item } = data

  // Find CMS configuration for this site/collection
  const cmsConfig = await prisma.cmsConfiguration.findFirst({
    where: {
      platform_type: 'webflow',
      site_id: site,
      collection_id: collection,
      is_active: true
    }
  })

  if (!cmsConfig) {
    console.log(`No CMS configuration found for Webflow site ${site}, collection ${collection}`)
    return
  }

  // Find the corresponding blog post
  const publication = await prisma.cmsPublication.findFirst({
    where: {
      cms_config_id: cmsConfig.id,
      external_id: item.id
    },
    include: {
      blog_post: true
    }
  })

  if (!publication) {
    console.log(`No blog post found for Webflow item ${item.id}`)
    return
  }

  // Create sync event
  await prisma.syncEvent.create({
    data: {
      cms_config_id: cmsConfig.id,
      blog_id: publication.blog_id,
      sync_direction: 'inbound',
      event_type: eventType === 'collection_item_created' ? 'create' : 'update',
      changes_detected: {
        webflow_data: item,
        detected_changes: detectChanges(publication.blog_post, item),
        timestamp: new Date().toISOString()
      },
      status: 'pending'
    }
  })

  // Update publication metadata
  await prisma.cmsPublication.update({
    where: { id: publication.id },
    data: {
      last_synced_at: new Date(),
      external_metadata: {
        ...publication.external_metadata,
        last_webhook_event: eventType,
        last_webhook_data: item
      }
    }
  })

  console.log(`Processed Webflow ${eventType} for item ${item.id}`)
}

async function handleWebflowItemDeletion(data: any) {
  const { site, collection, item } = data

  // Find CMS configuration
  const cmsConfig = await prisma.cmsConfiguration.findFirst({
    where: {
      platform_type: 'webflow',
      site_id: site,
      collection_id: collection,
      is_active: true
    }
  })

  if (!cmsConfig) return

  // Find and update publication
  const publication = await prisma.cmsPublication.findFirst({
    where: {
      cms_config_id: cmsConfig.id,
      external_id: item.id
    }
  })

  if (publication) {
    // Create sync event
    await prisma.syncEvent.create({
      data: {
        cms_config_id: cmsConfig.id,
        blog_id: publication.blog_id,
        sync_direction: 'inbound',
        event_type: 'delete',
        changes_detected: {
          webflow_item_deleted: item.id,
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      }
    })

    // Update publication status
    await prisma.cmsPublication.update({
      where: { id: publication.id },
      data: {
        status: 'archived',
        last_synced_at: new Date()
      }
    })

    console.log(`Processed Webflow deletion for item ${item.id}`)
  }
}

async function handleWebflowSitePublish(data: any) {
  const { site } = data

  // Find all CMS configurations for this site
  const cmsConfigs = await prisma.cmsConfiguration.findMany({
    where: {
      platform_type: 'webflow',
      site_id: site,
      is_active: true
    }
  })

  for (const config of cmsConfigs) {
    // Create sync event for site publish
    await prisma.syncEvent.create({
      data: {
        cms_config_id: config.id,
        sync_direction: 'inbound',
        event_type: 'bulk_sync',
        changes_detected: {
          site_published: site,
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      }
    })

    // Update all publications for this config
    await prisma.cmsPublication.updateMany({
      where: {
        cms_config_id: config.id,
        status: 'draft'
      },
      data: {
        status: 'published',
        last_synced_at: new Date()
      }
    })
  }

  console.log(`Processed Webflow site publish for site ${site}`)
}

async function handleWordPressWebhook(payload: any) {
  // Placeholder for WordPress webhook handling
  console.log('WordPress webhook received:', payload)
  return NextResponse.json({ success: true, message: 'WordPress webhook received' })
}

function detectChanges(blogPost: any, webflowItem: any): any {
  const changes: any = {}

  // Compare key fields to detect changes
  if (blogPost.title !== webflowItem.name) {
    changes.title = { local: blogPost.title, remote: webflowItem.name }
  }

  if (blogPost.slug !== webflowItem.slug) {
    changes.slug = { local: blogPost.slug, remote: webflowItem.slug }
  }

  // Add more field comparisons as needed

  return changes
}

function verifyWebhookSignature(payload: any, signature: string, platform: string): boolean {
  try {
    const secret = process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`]
    if (!secret) {
      console.warn(`No webhook secret configured for ${platform}`)
      return true // Allow if no secret configured
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}
