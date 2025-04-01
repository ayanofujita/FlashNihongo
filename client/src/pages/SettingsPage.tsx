import { IconUploader } from "@/components/settings/IconUploader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="pwa">PWA Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Theme customization options will be added in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pwa">
          <Card>
            <CardHeader>
              <CardTitle>PWA Icon</CardTitle>
              <CardDescription>
                Customize the app icon that appears on your home screen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IconUploader />
              
              <div className="mt-6 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">How to Install FlashNihongo as a PWA</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open FlashNihongo in your mobile browser</li>
                  <li>Tap the menu button (usually three dots) in your browser</li>
                  <li>Select "Add to Home Screen" or "Install App"</li>
                  <li>Follow your browser's prompts to complete installation</li>
                  <li>You'll now have FlashNihongo as an app on your device!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}