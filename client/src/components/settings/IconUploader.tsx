import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function IconUploader() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is SVG
    if (file.type !== "image/svg+xml") {
      toast({
        title: "Invalid file type",
        description: "Please upload an SVG file",
        variant: "destructive",
      });
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // Store in localStorage to persist the custom icon
      localStorage.setItem("customIcon", result);
      
      // Update manifest icons dynamically
      updateManifestIcons(result);
      
      toast({
        title: "Icon uploaded",
        description: "Your custom icon has been set as the app icon",
      });
    };
    reader.readAsDataURL(file);
  };

  const updateManifestIcons = (svgDataUrl: string) => {
    // This is a client-side approach to updating the icon
    // In a production app, we would update the actual manifest file on the server
    const iconLink = document.querySelector('link[rel="icon"]');
    if (iconLink) {
      iconLink.setAttribute("href", svgDataUrl);
    } else {
      const newIconLink = document.createElement("link");
      newIconLink.rel = "icon";
      newIconLink.href = svgDataUrl;
      document.head.appendChild(newIconLink);
    }

    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute("href", svgDataUrl);
    }
  };

  // Load custom icon from localStorage on component mount
  useEffect(() => {
    const savedIcon = localStorage.getItem("customIcon");
    if (savedIcon) {
      setPreviewUrl(savedIcon);
      updateManifestIcons(savedIcon);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="icon-upload">Custom App Icon (SVG only)</Label>
        <Input
          id="icon-upload"
          type="file"
          accept=".svg"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload SVG Icon
        </Button>
      </div>

      {previewUrl && (
        <div className="space-y-2">
          <Label>Icon Preview</Label>
          <div className="flex items-center justify-center p-4 border rounded-md">
            <img
              src={previewUrl}
              alt="Custom icon preview"
              className="w-24 h-24"
            />
          </div>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              localStorage.removeItem("customIcon");
              setPreviewUrl(null);
              // Reset to default icon
              const iconLink = document.querySelector('link[rel="icon"]');
              if (iconLink) {
                iconLink.setAttribute("href", "/icon-192x192.png");
              }
              const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
              if (appleTouchIcon) {
                appleTouchIcon.setAttribute("href", "/icon-192x192.png");
              }
              toast({
                title: "Icon reset",
                description: "App icon has been reset to default",
              });
            }}
          >
            Reset to Default Icon
          </Button>
        </div>
      )}
    </div>
  );
}