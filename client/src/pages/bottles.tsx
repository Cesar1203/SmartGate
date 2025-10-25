import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Wine, CheckCircle, Blend, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Flight, BottleAnalysis, BottleAction } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Bottles() {
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BottleAnalysis | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: flights } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const { data: recentAnalyses } = useQuery<BottleAnalysis[]>({
    queryKey: ["/api/bottles/recent"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { flightId: string; imageData: string }) => {
      return await apiRequest("POST", "/api/bottles/analyze", data);
    },
    onSuccess: (result: BottleAnalysis) => {
      setAnalysisResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/bottles/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Analysis complete",
        description: "Bottle has been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
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

  const analyzeImage = () => {
    if (!capturedImage || !selectedFlightId) {
      toast({
        title: "Missing information",
        description: "Please select a flight and capture an image first.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate({ flightId: selectedFlightId, imageData: capturedImage });
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    stopCamera();
  };

  const getActionIcon = (action: BottleAction) => {
    switch (action) {
      case "reuse":
        return <CheckCircle className="h-4 w-4" />;
      case "combine":
        return <Blend className="h-4 w-4" />;
      case "discard":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: BottleAction) => {
    switch (action) {
      case "reuse":
        return "bg-chart-2 text-white border-chart-2";
      case "combine":
        return "bg-chart-3 text-white border-chart-3";
      case "discard":
        return "bg-chart-5 text-white border-chart-5";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Bottle Handling</h1>
        <p className="text-sm text-muted-foreground">AI-powered bottle recognition with action recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Capture & Analyze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Flight</label>
              <Select value={selectedFlightId} onValueChange={setSelectedFlightId}>
                <SelectTrigger data-testid="select-flight">
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
                <Button onClick={startCamera} className="w-full" data-testid="button-start-camera">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-image"
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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-md bg-black aspect-video"
                />
                <div className="flex gap-2">
                  <Button onClick={captureImage} className="flex-1" data-testid="button-capture">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {capturedImage && !analysisResult && (
              <div className="space-y-4">
                <img src={capturedImage} alt="Captured bottle" className="w-full rounded-md" />
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeImage}
                    disabled={analyzeMutation.isPending || !selectedFlightId}
                    className="flex-1"
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending ? "Analyzing..." : "Analyze Image"}
                  </Button>
                  <Button onClick={resetCapture} variant="outline">
                    Retake
                  </Button>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <img src={capturedImage!} alt="Analyzed bottle" className="w-full rounded-md" />
                <div className="p-4 rounded-md border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bottle Type</span>
                    <span className="text-sm">{analysisResult.bottleType || "Unknown"}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Fill Level</span>
                      <span className="text-sm font-mono">{analysisResult.fillLevel || 0}%</span>
                    </div>
                    <Progress value={analysisResult.fillLevel || 0} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recommended Action</span>
                    <Badge className={`gap-1 ${getActionColor(analysisResult.recommendedAction!)}`}>
                      {getActionIcon(analysisResult.recommendedAction!)}
                      {analysisResult.recommendedAction}
                    </Badge>
                  </div>
                  {analysisResult.aiAnalysis && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{analysisResult.aiAnalysis}</p>
                    </div>
                  )}
                </div>
                <Button onClick={resetCapture} variant="outline" className="w-full">
                  Analyze Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnalyses && recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.slice(0, 10).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-3 rounded-md border hover-elevate"
                    data-testid={`analysis-${analysis.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Wine className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{analysis.bottleType || "Unknown Type"}</p>
                          <Badge size="sm" className={`gap-1 flex-shrink-0 ${getActionColor(analysis.recommendedAction!)}`}>
                            {getActionIcon(analysis.recommendedAction!)}
                            {analysis.recommendedAction}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Fill: {analysis.fillLevel}%</span>
                          <span>{new Date(analysis.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No analyses yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
