"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems, footerMenuItem, sidebarConfig } from "@/config/sidebar";
import useInfo from "@/stores/useUserInfo";
import { useLogout } from "@/features/auth/query";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { username, nickname, deptName, permissions } = useInfo();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  {/* <Home className="size-4" /> */}
                  <Image src="/logo2.png" alt="logo" width={40} height={40} unoptimized />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {sidebarConfig.appTitle}
                  </span>
                  <span className="truncate text-xs">
                    {sidebarConfig.appSubtitle}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>{sidebarConfig.groupLabel}</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // 1. Check parent permission
                if (item.require && !permissions.includes(item.require)) {
                  return null;
                }

                if (item.items) {
                  // 2. Filter child items
                  const filteredItems = item.items.filter(
                    (subItem) =>
                      !subItem.require || permissions.includes(subItem.require)
                  );

                  // If no children left, don't render parent
                  if (filteredItems.length === 0) {
                    return null;
                  }

                  // 检查是否有子菜单项被激活
                  const hasActiveSubItem = filteredItems.some(
                    (subItem) => pathname === subItem.url,
                  );
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={hasActiveSubItem}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={state === "collapsed" && hasActiveSubItem}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {filteredItems.map((subItem) => {
                              const isSubActive = pathname === subItem.url;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                  >
                                    <Link href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // 如果没有子菜单且没有 URL，则不渲染（或者渲染为不可点击的标题，视需求而定，这里假设单级菜单必须有 URL）
                if (!item.url) return null;

                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <HoverCard openDelay={100}>
              <HoverCardTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <footerMenuItem.icon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <Link href="/profile">
                      <span className="truncate font-semibold">{nickname}</span>
                      {/*<span className="truncate text-xs">{footerMenuItem.title}</span>*/}
                    </Link>
                  </div>
                </SidebarMenuButton>
              </HoverCardTrigger>
              <HoverCardContent
                align="start"
                side="right"
                sideOffset={12}
                className="w-48 space-y-3 rounded-xl border border-border/60 bg-popover/95 p-4 shadow-lg backdrop-blur"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {nickname}
                  </p>
                  <p className="text-xs text-muted-foreground">确认退出吗？</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  disabled={isLoggingOut}
                  onClick={() => logout()}
                >
                  <LogOut className="size-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </HoverCardContent>
            </HoverCard>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
