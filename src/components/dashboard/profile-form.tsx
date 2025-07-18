
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Droplets,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  User,
  Venus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";


const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender.",
  }),
  bloodType: z.string({ required_error: "Please select a blood type." }),
  lastDonationDate: z.date().optional(),
  city: z.string().min(2, "City is required."),
  mobileVisibility: z.boolean().default(false),
  geolocation: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { toast } = useToast();
  const { user, userProfile, deleteUserAccount } = useAuth();
  const [location, setLocation] = React.useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      mobileVisibility: true,
      geolocation: "",
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        gender: userProfile.gender as any,
        bloodType: userProfile.bloodType,
        lastDonationDate: userProfile.lastDonationDate,
        city: userProfile.city || "",
        mobileVisibility: userProfile.mobileVisibility ?? true,
        geolocation: userProfile.geolocation || ""
      });
      if (userProfile.geolocation) {
        setLocation(userProfile.geolocation);
      }
    }
  }, [userProfile, form]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: t('not_authenticated_toast_title'),
        description: t('not_authenticated_toast_desc'),
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const profileData: Partial<ProfileFormValues> = { ...data };
      if (!profileData.lastDonationDate) {
        delete profileData.lastDonationDate;
      }
      await setDoc(userDocRef, profileData, { merge: true });
      toast({
        title: t('profile_updated_toast_title'),
        description: t('profile_updated_toast_desc'),
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: t('update_failed_toast_title'),
        description: t('update_failed_toast_desc'),
      });
    }
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(locString);
          form.setValue("geolocation", locString);
        },
        () => {
          toast({
            variant: "destructive",
            title: t('geolocation_error_toast_title'),
            description: t('geolocation_error_toast_desc'),
          });
        }
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserAccount();
      toast({
        title: t('account_deleted_toast_title'),
        description: t('account_deleted_toast_desc'),
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('delete_failed_toast_title'),
        description: error.message || t('delete_failed_toast_desc'),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('donor_profile_title')}</CardTitle>
        <CardDescription>
          {t('donor_profile_subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('full_name_label')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="John Doe" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email_label')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="john.doe@example.com"
                          {...field}
                          className="pl-10"
                          readOnly // Email should not be editable
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact_number_label')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+1 (555) 000-0000" {...field} className="pl-10"/>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center">
                      <Venus className="mr-2 h-4 w-4 text-muted-foreground" />
                      {t('gender_label')}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">{t('male')}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">{t('female')}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <FormLabel className="font-normal">{t('other')}</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Droplets className="mr-2 h-4 w-4 text-muted-foreground" />
                      {t('blood_type_label')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_blood_group_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastDonationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('last_donation_date_label')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('pick_a_date')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('city_label')}</FormLabel>
                     <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t('city_placeholder')} {...field} className="pl-10"/>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileVisibility"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-1 md:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        {t('mobile_visibility_label')}
                      </FormLabel>
                      <FormDescription>
                        {t('mobile_visibility_desc')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="rounded-lg border p-4 col-span-1 md:col-span-2">
                <FormLabel>{t('geolocation_label')}</FormLabel>
                 <div className="flex items-center gap-4 mt-2">
                    <Button type="button" variant="outline" onClick={handleGetLocation}>
                      <LocateFixed className="mr-2 h-4 w-4" />
                      {t('get_my_location_btn')}
                    </Button>
                    <p className="text-sm text-muted-foreground flex-grow">
                      {location || t('geolocation_desc')}
                    </p>
                  </div>
              </div>
            </div>
            <Button type="submit">{t('update_profile_btn')}</Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 mt-8">
        <div className="flex justify-between items-center w-full">
            <div>
                <h3 className="text-lg font-semibold text-destructive">{t('danger_zone_title')}</h3>
                <p className="text-sm text-muted-foreground">{t('danger_zone_desc')}</p>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('delete_account_btn')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirm_delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('confirm_delete_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel_btn')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className={cn(
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        )}>
                            {t('delete_btn')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
