"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FindDonors } from "@/components/dashboard/find-donors";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AiAssistant } from "@/components/dashboard/ai-assistant";
import { Bot, UserCog, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your central hub for making a difference.
        </p>
      </div>
      <Tabs defaultValue="find-donors" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
          <TabsTrigger value="find-donors" className="py-2">
            <Users className="mr-2 h-4 w-4" />
            Find Donors
          </TabsTrigger>
          <TabsTrigger value="profile" className="py-2">
            <UserCog className="mr-2 h-4 w-4" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="py-2">
            <Bot className="mr-2 h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        <TabsContent value="find-donors" className="mt-6">
          <FindDonors />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="ai-assistant" className="mt-6">
          <AiAssistant />
        </TabsContent>
      </Tabs>
    </div>
  );
}
