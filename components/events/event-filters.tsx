"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";

interface EventFiltersProps {
  currentFilter: "upcoming" | "ongoing" | "past";
  searchQuery: string;
}

export function EventFilters({ currentFilter, searchQuery }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.set("filter", currentFilter);
      
      startTransition(() => {
        router.push(`/events?${params.toString()}`);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", value);
    if (search) {
      params.set("search", search);
    }
    
    startTransition(() => {
      router.push(`/events?${params.toString()}`);
    });
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <Tabs value={currentFilter} onValueChange={handleFilterChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
