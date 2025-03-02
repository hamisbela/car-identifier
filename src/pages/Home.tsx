import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Car, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default car image path
const DEFAULT_IMAGE = "/default-car.jpg";

// Default analysis for the car
const DEFAULT_ANALYSIS = `1. Car Identification:
- Make: Porsche
- Model: 911 (992 Series)
- Year Range: 2019-Present
- Variant: Carrera S
- Body Style: Coupe
- Distinguishing Features: Iconic sloping rear, wide rear fenders, LED light bar

2. Technical Specifications:
- Engine: 3.0L Twin-Turbocharged Flat-Six
- Power Output: Approximately 443 hp (330 kW)
- Transmission: 8-speed PDK dual-clutch automatic or 7-speed manual
- Drivetrain: Rear-wheel drive (RWD)
- 0-60 mph: Around 3.5 seconds
- Top Speed: Approximately 191 mph (307 km/h)

3. Design & Features:
- Exterior: Streamlined profile, LED headlights, retractable door handles
- Interior: Digital instrument cluster, 10.9-inch touchscreen, minimalist design
- Safety Systems: Adaptive cruise control, lane keep assist, automatic emergency braking
- Technology: Apple CarPlay, Android Auto, navigation system, Porsche Connect
- Notable Options: Sport Chrono package, ceramic brakes, adaptive suspension

4. Market & Value:
- Starting Price: $115,000-$130,000 (base model, when new)
- Current Market Position: Premium sports car segment
- Competitors: Ferrari F8, McLaren 570S, Audi R8, Mercedes-AMG GT
- Depreciation Rate: Lower than average (strong value retention)
- Collectibility Potential: High (continuing the legacy of the iconic 911 line)

5. Additional Information:
- Heritage: Continues the lineage of the 911, first introduced in 1963
- Performance History: Extensive motorsport heritage in endurance racing
- Interesting Facts: The 992 is the 8th generation of the Porsche 911
- Environmental Rating: Improved fuel efficiency over previous generations
- Ownership Considerations: High-performance driving experience, specialized maintenance`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const carPrompt = "Analyze this car image for educational purposes and provide the following information:\n1. Car identification (make, model, year range, variant, body style, distinguishing features)\n2. Technical specifications (engine, power output, transmission, drivetrain, performance metrics)\n3. Design and features (exterior, interior, safety systems, technology, notable options)\n4. Market and value (price range, market position, competitors, depreciation, collectibility)\n5. Additional information (heritage, performance history, interesting facts, environmental rating)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, carPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Car Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a car photo for educational automotive identification and vehicle information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Car Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG or WEBP (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Car preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Car className="-ml-1 mr-2 h-5 w-5" />
                      Identify Car
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Car Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Car Identifier: Your Educational Guide to Automotive Recognition</h2>
          
          <p>Welcome to our free car identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different vehicle makes and models,
             providing essential information about specifications, features, and market value.</p>

          <h3>How Our Educational Car Identifier Works</h3>
          <p>Our tool uses AI to analyze vehicle photos and provide educational information about make,
             model, specifications, and features. Simply upload a clear photo of a car,
             and our AI will help you learn about its details and characteristics.</p>

          <h3>Key Features of Our Car Identifier</h3>
          <ul>
            <li>Educational automotive information</li>
            <li>Detailed technical specifications</li>
            <li>Design and feature insights</li>
            <li>Market value and positioning information</li>
            <li>Historical and interesting facts</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Car makes and models identification</li>
            <li>Vehicle technical specifications</li>
            <li>Automotive design and features</li>
            <li>Market value and competitor analysis</li>
            <li>Automotive history and interesting facts</li>
          </ul>

          <p>Try our free car identifier today and expand your knowledge of automotive vehicles!
             No registration required - just upload a photo and start learning about fascinating cars from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}