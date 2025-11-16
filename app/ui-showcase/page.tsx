"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function UIShowcase() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">UI Component Showcase</h1>
          <p className="text-muted-foreground">Turuncu & Beyaz Tema - Modern Animasyonlarla</p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link Button</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default (Orange)</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card with Hover</CardTitle>
                <CardDescription>Hover to see elevation effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This card has a smooth hover animation with shadow transition.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Card</CardTitle>
                <CardDescription>Sample event details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>Music</Badge>
                  <Badge variant="success">Available</Badge>
                </div>
                <p className="text-sm">📅 December 25, 2025</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Info</CardTitle>
                <CardDescription>Pricing details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">$49.99</p>
                <p className="text-sm text-muted-foreground">per ticket</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Form Elements</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sample Form</CardTitle>
              <CardDescription>Try focusing on inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Type your message here..." />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={checked}
                  onCheckedChange={(checked) => setChecked(checked as boolean)}
                />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>

              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>
        </section>

        {/* Avatar Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Avatars</h2>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Tabs</h2>
          <Card>
            <CardHeader>
              <CardTitle>Tabbed Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    This is the overview tab with smooth transitions.
                  </p>
                </TabsContent>
                <TabsContent value="details" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Detailed information goes here.
                  </p>
                </TabsContent>
                <TabsContent value="settings" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Settings panel content.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Dialog Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Dialogs</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog with Backdrop Blur</DialogTitle>
                <DialogDescription>
                  This dialog has a blurred backdrop and smooth animations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Enter something..." />
                <p className="text-sm text-muted-foreground">
                  Notice the smooth fade and scale animation when opening.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary (Orange)</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-secondary"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-muted"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">Accent</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
