
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Mail, MapPin, Phone, Search, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useLanguage } from "@/context/language-context";

interface Donor {
    uid: string;
    name: string;
    bloodType: string;
    city: string;
    phone?: string;
    mobileVisible?: boolean;
    email: string;
    emailVisible?: boolean; // We'll assume email is always visible if provided
}


type RevealedState = {
  [key: string]: { phone?: boolean; email?: boolean };
};

export function FindDonors() {
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bloodType, setBloodType] = useState("all");
  const [city, setCity] = useState("");
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [revealed, setRevealed] = useState<RevealedState>({});
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const donorsData: Donor[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Only include users who have provided essential donor info
            if (data.name && data.bloodType && data.city) {
                donorsData.push({
                    uid: doc.id,
                    name: data.name,
                    bloodType: data.bloodType,
                    city: data.city,
                    phone: data.phone,
                    mobileVisible: data.mobileVisibility,
                    email: data.email,
                    emailVisible: true, // Assuming email is always visible if they have one
                });
            }
        });
        setAllDonors(donorsData);
        setFilteredDonors(donorsData); // Initially show all donors
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const handleSearch = () => {
    let donors = allDonors;

    if (bloodType && bloodType !== "all") {
      donors = donors.filter(donor => donor.bloodType === bloodType);
    }

    if (city.trim() !== "") {
      donors = donors.filter(donor => donor.city.toLowerCase().includes(city.trim().toLowerCase()));
    }
    
    setFilteredDonors(donors);
  };

  const handleReveal = (uid: string, type: 'phone' | 'email') => {
    setRevealed(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [type]: true },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('find_donor_title')}</CardTitle>
        <CardDescription>
          {t('find_donor_subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
             <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select onValueChange={setBloodType} value={bloodType}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder={t('select_blood_type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_blood_types')}</SelectItem>
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
          <div className="relative flex-grow">
             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder={t('enter_city_placeholder')}
                className="pl-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
          </div>
          <Button className="flex-shrink-0" onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            {t('search_btn')}
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name_table_header')}</TableHead>
                <TableHead>{t('blood_type_table_header')}</TableHead>
                <TableHead>{t('city_table_header')}</TableHead>
                <TableHead>{t('email_table_header')}</TableHead>
                <TableHead className="text-right">{t('contact_table_header')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredDonors.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t('no_donors_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonors.map((donor) => (
                  <TableRow key={donor.uid}>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">{donor.bloodType}</Badge>
                    </TableCell>
                    <TableCell>{donor.city}</TableCell>
                    <TableCell>
                      {revealed[donor.uid]?.email ? (
                        <span className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" /> {donor.email}
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleReveal(donor.uid, 'email')} disabled={!donor.emailVisible}>
                          {donor.emailVisible ? t('reveal_email_btn') : t('not_visible_btn')}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {revealed[donor.uid]?.phone ? (
                         <span className="flex items-center justify-end">
                          <Phone className="mr-2 h-4 w-4" /> {donor.phone}
                        </span>
                      ) : (
                         <Button size="sm" onClick={() => handleReveal(donor.uid, 'phone')} disabled={!donor.mobileVisible || !donor.phone}>
                          {donor.mobileVisible && donor.phone ? t('reveal_contact_btn') : t('not_visible_btn')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
