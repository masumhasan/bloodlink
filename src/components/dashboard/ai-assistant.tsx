"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { donorFaqChatbot } from "@/ai/flows/donor-faq-chatbot";
import { intelligentDonorMatches } from "@/ai/flows/intelligent-donor-matches";
import type { IntelligentDonorMatchesOutput } from "@/ai/flows/intelligent-donor-matches";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

type Message = {
  role: "user" | "bot";
  content: string;
};

function FAQChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await donorFaqChatbot({ query: input });
      const botMessage: Message = { role: "bot", content: result.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "bot",
        content: t('ai_error_message'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-grow p-4 border rounded-md" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "bot" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
               {message.role === "user" && (
                <Avatar className="h-8 w-8">
                   <AvatarFallback><User size={20}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20}/></AvatarFallback>
               </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                 <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('faq_chatbot_placeholder')}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function IntelligentMatcher() {
    const [formState, setFormState] = useState({
        patientBloodType: "",
        patientCity: "",
        patientNeeds: "",
        searchRadiusKm: 50,
    });
    const [results, setResults] = useState<IntelligentDonorMatchesOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResults(null);
        try {
            const res = await intelligentDonorMatches({
                ...formState,
                searchRadiusKm: Number(formState.searchRadiusKm)
            });
            setResults(res);
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('ai_error_toast_title'),
                description: t('ai_matcher_error_toast_desc')
            })
        } finally {
            setIsLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
    
    const handleSelectChange = (value: string) => {
        setFormState(prev => ({...prev, patientBloodType: value}));
    }


    return (
      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold font-headline">{t('patient_details_title')}</h3>
            <div>
                <Label htmlFor="patientBloodType">{t('blood_type_label')}</Label>
                <Select name="patientBloodType" onValueChange={handleSelectChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('select_blood_type_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="patientCity">{t('city_label')}</Label>
                <Input name="patientCity" value={formState.patientCity} onChange={handleChange} placeholder={t('city_placeholder')}/>
            </div>
             <div>
                <Label htmlFor="searchRadiusKm">{t('search_radius_label')}</Label>
                <Input name="searchRadiusKm" type="number" value={formState.searchRadiusKm} onChange={handleChange}/>
            </div>
             <div>
                <Label htmlFor="patientNeeds">{t('specific_needs_label')}</Label>
                <Textarea name="patientNeeds" value={formState.patientNeeds} onChange={handleChange} placeholder={t('specific_needs_placeholder')}/>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                {t('find_intelligent_matches_btn')}
            </Button>
        </form>
        <div className="h-[600px]">
            <h3 className="text-lg font-semibold font-headline mb-4">{t('suggested_donors_title')}</h3>
            <ScrollArea className="h-full border rounded-md">
            {isLoading && !results && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {results ? (
                <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">{results.summary}</p>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('donor_table_header')}</TableHead>
                                <TableHead>{t('blood_type_table_header')}</TableHead>
                                <TableHead>{t('distance_table_header')}</TableHead>
                                <TableHead>{t('score_table_header')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.suggestedDonors.map((donor, index) => (
                                <TableRow key={index}>
                                    <TableCell>{donor.donorName}</TableCell>
                                    <TableCell>{donor.donorBloodType}</TableCell>
                                    <TableCell>{donor.distanceKm} km</TableCell>
                                    <TableCell>{donor.suitabilityScore}/100</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : !isLoading && (
                 <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>{t('intelligent_matcher_prompt')}</p>
                </div>
            )}
            </ScrollArea>
        </div>
      </div>
    );
}

export function AiAssistant() {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('ai_assistant_title')}</CardTitle>
        <CardDescription>
          {t('ai_assistant_subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">{t('faq_chatbot_tab')}</TabsTrigger>
            <TabsTrigger value="matcher">{t('intelligent_matcher_tab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="faq" className="mt-6">
            <FAQChatbot />
          </TabsContent>
          <TabsContent value="matcher" className="mt-6">
            <IntelligentMatcher />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
