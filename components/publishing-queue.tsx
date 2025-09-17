'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QueueEntry {
  id: string
  blog_id: string
  cms_config_id: string
  scheduled_for: string
  priority: number
  retry_count: number
  max_retries: number
  status: string
  job_data?: any
  error_details?: any
  processed_at?: string
  created_at: string
  updated_at: string
  blog_post?: {
    id: string
    title: string
    status: string
    created_at: string
  }
  cms_config?: {
    id: string
    platform_type: string
    name: string
  }
}

interface QueueStats {
  total: number
  queued: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

const STATUS_COLORS = {
  queued: 'yellow',
  processing: 'blue',
  completed: 'green',
  failed: 'red',
  cancelled: 'gray'
} as const

export function PublishingQueue() {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchQueue()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchQueue, 5000) // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/publish/bulk')
      if (!response.ok) throw new Error('Failed to fetch queue')
      
      const data = await response.json()
      setQueueEntries(data.queue_entries || [])
      
      // Calculate stats
      const entries = data.queue_entries || []
      const newStats = {
        total: entries.length,
        queued: entries.filter((e: QueueEntry) => e.status === 'queued').length,
        processing: entries.filter((e: QueueEntry) => e.status === 'processing').length,
        completed: entries.filter((e: QueueEntry) => e.status === 'completed').length,
        failed: entries.filter((e: QueueEntry) => e.status === 'failed').length,
        cancelled: entries.filter((e: QueueEntry) => e.status === 'cancelled').length
      }
      setStats(newStats)
      
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryJob = async (entryId: string) => {
    try {
      const response = await fetch(`/api/publish/queue/${entryId}/retry`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to retry job')
      
      toast({
        title: 'Success',
        description: 'Job queued for retry'
      })
      
      fetchQueue()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry job',
        variant: 'destructive'
      })
    }
  }

  const cancelJob = async (entryId: string) => {
    try {
      const response = await fetch(`/api/publish/queue/${entryId}/cancel`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to cancel job')
      
      toast({
        title: 'Success',
        description: 'Job cancelled'
      })
      
      fetchQueue()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel job',
        variant: 'destructive'
      })
    }
  }

  const deleteJob = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    
    try {
      const response = await fetch(`/api/publish/queue/${entryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete job')
      
      toast({
        title: 'Success',
        description: 'Job deleted'
      })
      
      fetchQueue()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0
    return Math.round(((stats.completed + stats.failed + stats.cancelled) / stats.total) * 100)
  }

  if (loading) {
    return <div className="p-6">Loading publishing queue...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Publishing Queue</h2>
          <p className="text-gray-600">Monitor and manage publishing jobs</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchQueue}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Overview</CardTitle>
            <CardDescription>Current publishing queue status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div>
                  <p className="text-gray-500">Queued</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.queued}</p>
                </div>
                <div>
                  <p className="text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Activity</CardTitle>
            <CardDescription>Jobs currently being processed</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.processing > 0 ? (
              <div className="space-y-3">
                {queueEntries
                  .filter(entry => entry.status === 'processing')
                  .slice(0, 3)
                  .map(entry => (
                    <div key={entry.id} className="flex items-center space-x-3">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      <div className="flex-1">
                        <p className="font-medium">{entry.blog_post?.title}</p>
                        <p className="text-sm text-gray-500">{entry.cms_config?.name}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No jobs currently processing
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Entries</CardTitle>
          <CardDescription>All publishing jobs in the queue</CardDescription>
        </CardHeader>
        <CardContent>
          {queueEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jobs in the queue
            </div>
          ) : (
            <div className="space-y-4">
              {queueEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(entry.status)}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {entry.blog_post?.title || 'Unknown Post'}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={`text-${STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}-600`}
                          >
                            {entry.status}
                          </Badge>
                          
                          <Badge variant="secondary">
                            {entry.cms_config?.name || 'Unknown Platform'}
                          </Badge>
                          
                          <span className="text-sm text-gray-500">
                            Priority: {entry.priority}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-2">
                          <span>
                            Scheduled: {formatDistanceToNow(new Date(entry.scheduled_for), { addSuffix: true })}
                          </span>
                          
                          {entry.retry_count > 0 && (
                            <span className="ml-4">
                              Retries: {entry.retry_count}/{entry.max_retries}
                            </span>
                          )}
                          
                          {entry.processed_at && (
                            <span className="ml-4">
                              Processed: {formatDistanceToNow(new Date(entry.processed_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Error Details */}
                        {entry.status === 'failed' && entry.error_details && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800 font-medium">Error:</p>
                            <p className="text-sm text-red-700 mt-1">
                              {entry.error_details.message || 'Unknown error'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {entry.status === 'failed' && entry.retry_count < entry.max_retries && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryJob(entry.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(entry.status === 'queued' || entry.status === 'processing') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelJob(entry.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(entry.status === 'completed' || entry.status === 'failed' || entry.status === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteJob(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
