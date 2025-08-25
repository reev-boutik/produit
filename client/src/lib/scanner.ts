export interface BarcodeResult {
  text: string;
  format: string;
}

export class BarcodeScanner {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isScanning = false;
  private onBarcodeDetected: ((result: BarcodeResult) => void) | null = null;

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement;
    
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser/environment');
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      this.video.srcObject = this.stream;
      await this.video.play();
    } catch (error) {
      throw new Error('Failed to access camera: ' + (error as Error).message);
    }
  }

  startScanning(onDetected: (result: BarcodeResult) => void): void {
    if (!this.video) {
      throw new Error('Scanner not initialized');
    }

    this.isScanning = true;
    this.onBarcodeDetected = onDetected;
    
    // Check if BarcodeDetector is available
    if ('BarcodeDetector' in window) {
      this.startNativeBarcodeDetection();
    } else {
      // Fallback to manual detection or show error
      console.warn('BarcodeDetector not supported, using fallback detection');
      this.startFallbackDetection();
    }
  }

  private async startNativeBarcodeDetection(): Promise<void> {
    if (!this.video || !this.isScanning) return;

    try {
      // @ts-ignore - BarcodeDetector may not be in TypeScript types yet
      const barcodeDetector = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code']
      });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      const detectFrame = async () => {
        if (!this.video || !this.isScanning || !context) return;

        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);

        try {
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            this.onBarcodeDetected?.({
              text: barcode.rawValue,
              format: barcode.format
            });
            return;
          }
        } catch (error) {
          console.warn('Barcode detection error:', error);
        }

        // Continue scanning
        requestAnimationFrame(detectFrame);
      };

      detectFrame();
    } catch (error) {
      console.error('Native barcode detection failed:', error);
      this.startFallbackDetection();
    }
  }

  private startFallbackDetection(): void {
    // Simulate barcode detection for development
    // In production, you would integrate with a library like ZXing
    console.log('Fallback barcode detection started');
    
    // For demonstration, we'll provide a way to manually trigger detection
    // Real implementation would use a barcode detection library
  }

  stopScanning(): void {
    this.isScanning = false;
    this.onBarcodeDetected = null;
  }

  cleanup(): void {
    this.stopScanning();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  // Manual barcode entry for testing
  simulateBarcodeScan(barcode: string): void {
    if (this.onBarcodeDetected) {
      this.onBarcodeDetected({
        text: barcode,
        format: 'manual'
      });
    }
  }
}
