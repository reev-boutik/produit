import { useState, useRef, useEffect } from "react";
import { Camera, Square, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BarcodeScanner, type BarcodeResult } from "@/lib/scanner";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading?: boolean;
}

export default function BarcodeScannerComponent({ onBarcodeDetected, isLoading }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BarcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.cleanup();
      }
    };
  }, []);

  const initializeCamera = async () => {
    if (!videoRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new BarcodeScanner();
      }

      await scannerRef.current.initialize(videoRef.current);
      toast({
        title: "Camera Ready",
        description: "Camera initialized successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize camera";
      setError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const startScanning = async () => {
    if (!scannerRef.current) {
      await initializeCamera();
      if (!scannerRef.current) return;
    }

    try {
      scannerRef.current.startScanning((result: BarcodeResult) => {
        setIsScanning(false);
        onBarcodeDetected(result.text);
        toast({
          title: "Barcode Detected",
          description: `Found: ${result.text}`,
        });
      });
      
      setIsScanning(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start scanning";
      setError(errorMessage);
      toast({
        title: "Scanning Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning();
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onBarcodeDetected(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">Barcode Scanner</h2>
          <Camera className="w-6 h-6 text-material-green" />
        </div>

        {/* Camera View */}
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            data-testid="camera-video"
          />
          
          {!videoRef.current?.srcObject && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                <p className="text-gray-500 dark:text-gray-400">Position barcode in view</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
              <div className="text-center p-4">
                <Square className="w-16 h-16 text-red-400 mb-2 mx-auto" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 border-2 border-transparent">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-material-orange rounded-lg shadow-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-material-orange"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-material-orange"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-material-orange"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-material-orange"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-material-orange text-sm font-medium">
                  Scanning...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-3">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={isInitializing || isLoading}
              className="bg-material-blue hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
              data-testid="button-start-scanning"
            >
              <Play className="w-5 h-5" />
              <span>
                {isInitializing ? "Initializing..." : "Start Scanning"}
              </span>
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="flex items-center justify-center space-x-2"
              data-testid="button-stop-scanning"
            >
              <Pause className="w-5 h-5" />
              <span>Pause Scanning</span>
            </Button>
          )}

          {/* Manual Input */}
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Or enter barcode manually"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
              data-testid="input-manual-barcode"
            />
            <Button
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim() || isLoading}
              className="bg-material-green hover:bg-green-700 text-white"
              data-testid="button-search-manual"
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
