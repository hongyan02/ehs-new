"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateApplicationDialog from "./components/CreateApplicationDialog";
import MyApplicationList from "./components/MyApplicationList";
import MyApprovalList from "./components/MyApprovalList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DutyChangeView() {
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <div className="p-6">
            <Tabs defaultValue="my-approval" className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="my-approval">我的受理</TabsTrigger>
                        <TabsTrigger value="my-application">我的申请</TabsTrigger>
                    </TabsList>
                    <Button onClick={() => setCreateOpen(true)}>
                        新建申请
                    </Button>
                </div>
                <TabsContent value="my-application">
                    <MyApplicationList />
                </TabsContent>
                <TabsContent value="my-approval">
                    <MyApprovalList />
                </TabsContent>
            </Tabs>

            <CreateApplicationDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />
        </div>
    );
}