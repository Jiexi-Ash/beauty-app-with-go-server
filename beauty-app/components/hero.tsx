import React from 'react'
import { FunnelIcon, SearchIcon } from 'lucide-react'
import { Input } from './ui/input'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from './ui/button'
import { CATEGORIES } from '@/constants'

function Hero() {
    return (
        <div className="flex text-center items-center justify-center flex-col container mx-auto px-6 md:px-0 min-h-[70vh]">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">Book Your Perfect
                <br />
                <span className="text-primary">Experience</span></h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 px-4">
                Your marketplace for exceptional services. Search, compare, and book
                premium experiences from trusted businesses in seconds.
            </p>
            <div className="max-w-4xl mx-auto w-full bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 -translate-y-2">
                <div className="flex flex-col md:flex-row w-full gap-4">
                    <div className="flex flex-1 items-center border-border/50 border rounded-lg px-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                        <SearchIcon className="size-4" />
                        <Input
                            className="py-5 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                            placeholder="Search services, businesses"
                        />
                    </div>
                    <div className="flex items-center md:w-56 border-border/50 border rounded-lg px-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                        <FunnelIcon className="size-4" />
                        <Select defaultValue="All Categories">
                            <SelectTrigger className="w-full py-5 border-none shadow-none focus:ring-0">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="py-5 px-6 hover:bg-primary/80">
                        <SearchIcon className="size-4 hidden md:block" />
                        Search
                    </Button>
                </div>
            </div>
        </div >
    )
}

export default Hero