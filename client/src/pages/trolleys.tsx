import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, ClipboardCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Flight, TrolleyVerification } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Trolleys() {
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<TrolleyVerification | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: flights } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const { data: recentVerifications } = useQuery<TrolleyVerification[]>({
    queryKey: ["/api/trolleys/recent"],
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: { flightId: string; imageData: string; goldenLayoutName: string }) => {
      return await apiRequest("POST", "/api/trolleys/verify", data);
    },
    onSuccess: (result: TrolleyVerification) => {
      setVerificationResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/trolleys/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: result.hasErrors ? "Errors detected" : "Verification passed",
        description: result.hasErrors
          ? "Discrepancies found in trolley configuration."
          : "Trolley matches golden layout.",
        variant: result.hasErrors ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        // Ensure video plays
        await videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to capture images.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyImage = () => {
    if (!capturedImage || !selectedFlightId) {
      toast({
        title: "Missing information",
        description: "Please select a flight and capture an image first.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate({
      flightId: selectedFlightId,
      imageData: capturedImage,
      goldenLayoutName: "Standard Layout",
    });
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    stopCamera();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Trolley Verification</h1>
        <p className="text-sm text-muted-foreground">Visual comparison against golden layouts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Capture & Verify</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Flight</label>
              <Select value={selectedFlightId} onValueChange={setSelectedFlightId}>
                <SelectTrigger data-testid="select-flight-trolley">
                  <SelectValue placeholder="Choose a flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights?.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      {flight.flightNumber} - {flight.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!capturedImage && !isCapturing && (
              <div className="space-y-2">
                <Button onClick={startCamera} className="w-full" data-testid="button-start-camera-trolley">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-trolley"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {isCapturing && (
              <div className="space-y-4">
                <div className="relative rounded-md overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ minHeight: '300px' }}
                  />
                  <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
                    LIVE
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={captureImage} className="flex-1" data-testid="button-capture-trolley">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {capturedImage && !verificationResult && (
              <div className="space-y-4">
                <img src={capturedImage} alt="Captured trolley" className="w-full rounded-md" />
                <div className="flex gap-2">
                  <Button
                    onClick={verifyImage}
                    disabled={verifyMutation.isPending || !selectedFlightId}
                    className="flex-1"
                    data-testid="button-verify-trolley"
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Verify Trolley"}
                  </Button>
                  <Button onClick={resetCapture} variant="outline">
                    Retake
                  </Button>
                </div>
              </div>
            )}

            {verificationResult && (
              <div className="space-y-4">
                <img src={capturedImage!} alt="Verified trolley" className="w-full rounded-md" />
                <div className="p-4 rounded-md border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    {verificationResult.hasErrors ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Errors Found
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-chart-2 text-white border-chart-2">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {verificationResult.errors && verificationResult.errors.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Discrepancies:</p>
                      <ul className="space-y-1">
                        {verificationResult.errors.map((error, index) => (
                          <li key={index} className="text-xs text-destructive flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {verificationResult.aiAnalysis && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{verificationResult.aiAnalysis}</p>
                    </div>
                  )}
                </div>
                <Button onClick={resetCapture} variant="outline" className="w-full">
                  Verify Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVerifications && recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {recentVerifications.slice(0, 10).map((verification) => (
                  <div
                    key={verification.id}
                    className="p-3 rounded-md border hover-elevate"
                    data-testid={`verification-${verification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <ClipboardCheck className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{verification.goldenLayoutName}</p>
                          {verification.hasErrors ? (
                            <Badge size="sm" variant="destructive" className="gap-1 flex-shrink-0">
                              <AlertTriangle className="h-3 w-3" />
                              {verification.errors?.length || 0} errors
                            </Badge>
                          ) : (
                            <Badge size="sm" className="gap-1 flex-shrink-0 bg-chart-2 text-white border-chart-2">
                              <CheckCircle className="h-3 w-3" />
                              Passed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(verification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No verifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
