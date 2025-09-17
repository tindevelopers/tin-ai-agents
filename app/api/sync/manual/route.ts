import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cms_config_id, sync_direction = 'bidirectional', blog_id } = body

    if (!cms_config_id) {
      return NextResponse.json(
        { error: 'cms_config_id is required' },
        { status: 400 }
      )
    }

    // Verify CMS configuration exists and belongs to user
    const cmsConfig = await prisma.cmsConfiguration.findFirst({
      where: {
        id: cms_config_id,
        user_id: session.user.id,
        is_active: true
      }
    })

    if (!cmsConfig) {
      return NextResponse.json({ error: 'CMS configuration not found' }, { status: 404 })
    }

    // Create sync event(s)
    const syncEvents = []

    if (sync_direction === 'outbound' || sync_direction === 'bidirectional') {
      // Outbound sync: Blog Writer → CMS
      const outboundEvent = await prisma.syncEvent.create({
        data: {
          cms_config_id,
          blog_id,
          sync_direction: 'outbound',
          event_type: 'manual_sync',
          changes_detected: {
            triggered_by: session.user.id,
            timestamp: new Date().toISOString(),
            sync_type: 'manual'
          },
          status: 'pending'
        }
      })
      syncEvents.push(outboundEvent)
    }

    if (sync_direction === 'inbound' || sync_direction === 'bidirectional') {
      // Inbound sync: CMS → Blog Writer
      const inboundEvent = await prisma.syncEvent.create({
        data: {
          cms_config_id,
          blog_id,
          sync_direction: 'inbound',
          event_type: 'manual_sync',
          changes_detected: {
            triggered_by: session.user.id,
            timestamp: new Date().toISOString(),
            sync_type: 'manual'
          },
          status: 'pending'
        }
      })
      syncEvents.push(inboundEvent)
    }

    // In a real implementation, you would queue these sync events for processing
    // For now, we'll just mark them as pending and they would be processed by a background worker

    return NextResponse.json({
      message: 'Manual sync triggered successfully',
      sync_events: syncEvents.map(event => ({
        id: event.id,
        sync_direction: event.sync_direction,
        event_type: event.event_type,
        status: event.status
      }))
    })

  } catch (error) {
    console.error('Error triggering manual sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger manual sync' },
      { status: 500 }
    )
  }
}
