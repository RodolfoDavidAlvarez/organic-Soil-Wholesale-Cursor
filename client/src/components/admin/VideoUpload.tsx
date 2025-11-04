import React, { useState, useRef } from "react";
import { Upload, Video, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface VideoUploadProps {
  onUploadComplete?: (videoData: VideoData) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

interface VideoData {
  id: string;
  filename: string;
  url: string;
  size: number;
  duration?: number;
  thumbnail?: string;
}

export function VideoUpload({ onUploadComplete, maxSize = 50, acceptedFormats = ["mp4", "webm", "mov"] }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<VideoData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file format
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !acceptedFormats.includes(extension)) {
      setUploadError(`Please upload a video in one of these formats: ${acceptedFormats.join(", ")}`);
      return;
    }

    uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      const videoData: VideoData = {
        id: result.videoId,
        filename: file.name,
        url: result.url,
        size: file.size,
        duration: result.duration,
        thumbnail: result.thumbnail,
      };

      setUploadedVideo(videoData);
      onUploadComplete?.(videoData);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setUploadedVideo(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!uploadedVideo ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.map((format) => `.${format}`).join(",")}
              onChange={handleFileInput}
              className="hidden"
            />

            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

            <h3 className="text-lg font-semibold mb-2">Upload your video</h3>

            <p className="text-gray-600 mb-4">Drag and drop your video file here, or click to select</p>

            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="mb-4">
              Choose Video File
            </Button>

            <div className="text-sm text-gray-500">
              <p>Accepted formats: {acceptedFormats.join(", ")}</p>
              <p>Maximum size: {maxSize}MB</p>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Uploading...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">Upload Complete!</span>
              </div>
              <Button onClick={resetUpload} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Video Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Filename:</span>
                  <p className="font-medium">{uploadedVideo.filename}</p>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <p className="font-medium">{(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                {uploadedVideo.duration && (
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">{Math.round(uploadedVideo.duration)} seconds</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium text-green-600">Optimized</p>
                </div>
              </div>
            </div>

            {uploadedVideo.thumbnail && (
              <div>
                <h4 className="font-semibold mb-2">Preview:</h4>
                <img src={uploadedVideo.thumbnail} alt="Video thumbnail" className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Usage:</h4>
              <code className="text-sm bg-white p-2 rounded block">{`<VideoPlayer src="${uploadedVideo.url}" />`}</code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



