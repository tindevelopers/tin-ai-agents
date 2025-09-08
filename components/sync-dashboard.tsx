'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncEvent {
  id: string
  cms_config_id: string
  blog_id?: string
  sync_direction: 'inbound' | 'outbound'
  event_type: string
  changes_detected?: any
  status: string
  error_details?: any
  processed_at?: string
  created_at: string
  cms_config?: {
    id: string
    platform_type: string
    name: string
  }
  blog_post?: {
    id: string
    title: string
    status: string
  }
}

interface CmsPublication {
  id: string
  blog_id: string
  cms_config_id: string
  external_id?: string
  published_url?: string
  status: string
  last_synced_at?: string
  sync_hash?: string
  external_metadata?: any
  blog_post?: {
    id: string
    title: string
    status: string
  }
  cms_config?: {
    id: string
    platform_type: string
    name: string
  }
}

interface SyncStats {
  total_events: number
  successful_syncs: number
  failed_syncs: number
  pending_syncs: number
  out_of_sync_publications: number
}

export function SyncDashboard() {
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([])
  const [publications, setPublications] = useState<CmsPublication[]>([])
  const [stats, setStats] = useState<SyncStats>({
    total_events: 0,
    successful_syncs: 0,
    failed_syncs: 0,
    pending_syncs: 0,
    out_of_sync_publications: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('events')

  useEffect(() => {
    fetchSyncData()
  }, [])

  const fetchSyncData = async () => {
    try {
      const [eventsResponse, publicationsResponse] = await Promise.all([
        fetch('/api/sync/events'),
        fetch('/api/sync/publications')
      ])

      if (!eventsResponse.ok || !publicationsResponse.ok) {
        throw new Error('Failed to fetch sync data')
      }

      const eventsData = await eventsResponse.json()
      const publicationsData = await publicationsResponse.json()

      setSyncEvents(eventsData.events || [])
      setPublications(publicationsData.publications || [])

      // Calculate stats
      const events = eventsData.events || []
      const pubs = publicationsData.publications || []

      setStats({
        total_events: events.length,
        successful_syncs: events.filter((e: SyncEvent) => e.status === 'completed').length,
        failed_syncs: events.filter((e: SyncEvent) => e.status === 'failed').length,
        pending_syncs: events.filter((e: SyncEvent) => e.status === 'pending').length,
        out_of_sync_publications: pubs.filter((p: CmsPublication) => {
          const lastSync = p.last_synced_at ? new Date(p.last_synced_at) : null
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
          return !lastSync || lastSync < hourAgo
        }).length
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sync data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerManualSync = async (cmsConfigId: string) => {
    try {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cms_config_id: cmsConfigId,
          sync_direction: 'bidirectional'
        })
      })

      if (!response.ok) throw new Error('Failed to trigger sync')

      toast({
        title: 'Success',
        description: 'Manual sync triggered'
      })

      fetchSyncData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger manual sync',
        variant: 'destructive'
      })
    }
  }

  const getEventIcon = (event: SyncEvent) => {
    if (event.sync_direction === 'inbound') {
      return <ArrowDown className="h-4 w-4 text-blue-500" />
    } else {
      return <ArrowUp className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getSyncStatusColor = (publication: CmsPublication) => {
    if (!publication.last_synced_at) return 'red'
    
    const lastSync = new Date(publication.last_synced_at)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    return lastSync > hourAgo ? 'green' : 'yellow'
  }

  if (loading) {
    return <div className="p-6">Loading sync dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sync Dashboard</h2>
          <p className="text-gray-600">Monitor bidirectional synchronization with CMS platforms</p>
        </div>
        
        <Button onClick={fetchSyncData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Total Events</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_events}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Successful</span>
            </div>
            <p className="text-2xl font-bold">{stats.successful_syncs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-600">Failed</span>
            </div>
            <p className="text-2xl font-bold">{stats.failed_syncs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Out of Sync</span>
            </div>
            <p className="text-2xl font-bold">{stats.out_of_sync_publications}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="events">Sync Events</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Events</CardTitle>
              <CardDescription>Latest synchronization events between local and CMS platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {syncEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sync events found
                </div>
              ) : (
                <div className="space-y-4">
                  {syncEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex flex-col items-center space-y-1">
                            {getEventIcon(event)}
                            {getStatusIcon(event.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">
                                {event.blog_post?.title || event.event_type}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {event.sync_direction}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {event.cms_config?.name || 'Unknown Platform'}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <span>
                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                              </span>
                              {event.processed_at && (
                                <span>
                                  Processed: {formatDistanceToNow(new Date(event.processed_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>

                            {/* Changes detected */}
                            {event.changes_detected && Object.keys(event.changes_detected).length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800 font-medium">Changes detected:</p>
                                <div className="text-xs text-blue-700 mt-1">
                                  {Object.keys(event.changes_detected).join(', ')}
                                </div>
                              </div>
                            )}

                            {/* Error details */}
                            {event.status === 'failed' && event.error_details && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800 font-medium">Error:</p>
                                <p className="text-sm text-red-700 mt-1">
                                  {event.error_details.message || 'Unknown error'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publications">
          <Card>
            <CardHeader>
              <CardTitle>Published Content</CardTitle>
              <CardDescription>Content published to CMS platforms and their sync status</CardDescription>
            </CardHeader>
            <CardContent>
              {publications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No publications found
                </div>
              ) : (
                <div className="space-y-4">
                  {publications.map((publication) => (
                    <div key={publication.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">
                              {publication.blog_post?.title || 'Unknown Post'}
                            </h3>
                            <Badge variant="outline">
                              {publication.cms_config?.name || 'Unknown Platform'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-${getSyncStatusColor(publication)}-600`}
                            >
                              {publication.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                            {publication.published_url && (
                              <a 
                                href={publication.published_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Published
                              </a>
                            )}
                            {publication.last_synced_at && (
                              <span>
                                Last synced: {formatDistanceToNow(new Date(publication.last_synced_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerManualSync(publication.cms_config_id)}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts">
          <Card>
            <CardHeader>
              <CardTitle>Sync Conflicts</CardTitle>
              <CardDescription>Content conflicts that require manual resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No sync conflicts detected
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
