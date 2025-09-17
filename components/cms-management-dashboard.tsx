'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Send, 
  RefreshCw, 
  ArrowUpDown,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'

import { CmsConfigManager } from './cms-config-manager'
import { PublishingDashboard } from './publishing-dashboard'
import { PublishingQueue } from './publishing-queue'
import { SyncDashboard } from './sync-dashboard'

export function CmsManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CMS Management</h1>
          <p className="text-gray-600">Manage content publishing and synchronization across CMS platforms</p>
        </div>
      </div>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="publishing" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Publishing
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CmsOverview />
        </TabsContent>

        <TabsContent value="publishing">
          <PublishingDashboard />
        </TabsContent>

        <TabsContent value="queue">
          <PublishingQueue />
        </TabsContent>

        <TabsContent value="sync">
          <SyncDashboard />
        </TabsContent>

        <TabsContent value="config">
          <CmsConfigManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CmsOverview() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 Webflow, 1 WordPress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3 pending, 2 processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Health</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Publications</CardTitle>
            <CardDescription>Latest content published to CMS platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "How to Optimize Your Blog for SEO",
                  platform: "Webflow Blog",
                  status: "published",
                  time: "2 hours ago"
                },
                {
                  title: "The Future of Content Marketing",
                  platform: "WordPress Site", 
                  status: "published",
                  time: "5 hours ago"
                },
                {
                  title: "AI-Powered Content Creation Guide",
                  platform: "Webflow Blog",
                  status: "failed",
                  time: "1 day ago"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.platform}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={item.status === 'published' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Events</CardTitle>
            <CardDescription>Latest synchronization activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  event: "Inbound sync completed",
                  platform: "Webflow Blog",
                  changes: "3 posts updated",
                  time: "1 hour ago"
                },
                {
                  event: "Manual sync triggered",
                  platform: "WordPress Site",
                  changes: "Full sync requested",
                  time: "3 hours ago"
                },
                {
                  event: "Webhook received",
                  platform: "Webflow Blog", 
                  changes: "1 post modified",
                  time: "6 hours ago"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{item.event}</p>
                    <p className="text-sm text-gray-600">{item.platform} • {item.changes}</p>
                  </div>
                  <span className="text-sm text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Status */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>Connection status for configured CMS platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Main Webflow Site",
                platform: "Webflow",
                status: "connected",
                publications: 87,
                lastSync: "5 minutes ago"
              },
              {
                name: "Company Blog", 
                platform: "WordPress",
                status: "connected",
                publications: 34,
                lastSync: "1 hour ago"
              },
              {
                name: "Marketing Site",
                platform: "Webflow", 
                status: "error",
                publications: 6,
                lastSync: "2 days ago"
              }
            ].map((platform, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{platform.name}</h3>
                  <Badge 
                    variant={platform.status === 'connected' ? 'default' : 'destructive'}
                  >
                    {platform.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{platform.platform}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Publications:</span>
                    <span>{platform.publications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last sync:</span>
                    <span>{platform.lastSync}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
