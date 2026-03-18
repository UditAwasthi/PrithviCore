'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Upload, Bug, CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { diseaseAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface DetectionResult {
  disease: string; confidence: number; severity: string;
  treatment: string; affected_area_percent?: number;
}
interface HistoryItem { _id: string; disease_name: string; severity: string; confidence: number; timestamp: string; }

const SEV = {
  none:     'text-primary bg-primary/10 border-primary/20',
  low:      'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  moderate: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  high:     'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-destructive bg-destructive/10 border-destructive/20',
} as const;
type SevKey = keyof typeof SEV;

const CROPS = ['Tomato','Potato','Corn','Apple','Grape','Pepper','Peach','Cherry','Strawberry','Squash','Soybean','Wheat','Rice'];

export default function DiseasePage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState('');

  const { data: historyData, isLoading: historyLoading } = useQuery('disease-history', () =>
    diseaseAPI.history({ limit: 10 }).then((r) => r.data)
  );
  const history = historyData as { results?: HistoryItem[] } | undefined;

  const detect = useMutation(
    (fd: FormData) => diseaseAPI.detect(fd).then((r) => r.data as DetectionResult),
    {
      onSuccess: () => { qc.invalidateQueries('disease-history'); toast.success('Analysis complete!', { id: 'disease-success' }); },
      onError: (err: unknown) => {
        const msg = err instanceof AxiosError ? (err.response?.data?.error ?? 'Detection failed') : 'Detection failed';
        toast.error(typeof msg === 'string' ? msg : 'Detection failed. Is the AI service running?', { id: 'disease-error' });
      },
    }
  );

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    const fd = new FormData();
    fd.append('image', f);
    if (cropType) fd.append('crop_type', cropType);
    detect.mutate(fd);
  }, [cropType, detect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const result = detect.data;
  const sevCls = SEV[(result?.severity as SevKey) ?? 'moderate'];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Bug size={28} className="text-primary" /> Disease Detection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a clear leaf photo to identify plant diseases using AI</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upload Column */}
        <div className="space-y-4 flex flex-col h-full">
          <Card className="flex-1 shadow-sm flex flex-col border-border/50">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload size={18} className="text-muted-foreground" /> Analyze Leaf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col space-y-5">
              <div>
                <label htmlFor="crop-select" className="block text-sm font-semibold text-foreground mb-1.5">Crop Type (Optional)</label>
                <select id="crop-select" value={cropType} onChange={(e) => setCropType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer text-foreground">
                  <option value="">Auto-detect</option>
                  {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div {...getRootProps()} className={cn(
                "relative flex-1 min-h-[250px] flex flex-col outline-dashed outline-2 outline-offset-[-2px] rounded-2xl p-8 text-center cursor-pointer transition-all items-center justify-center overflow-hidden",
                isDragActive ? "outline-primary bg-primary/5" : "outline-border hover:outline-primary/50 hover:bg-muted/30",
                detect.isLoading && "pointer-events-none opacity-80"
              )}>
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Leaf preview" className="max-h-64 object-contain rounded-xl shadow-sm z-10" />
                    {detect.isLoading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-20 transition-all">
                        <div className="text-center animate-pulse-dot">
                          <span className="text-4xl inline-block mb-3 drop-shadow-md">🔬</span>
                          <p className="font-bold text-foreground text-sm tracking-wide">Analyzing leaf structure...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground shadow-inner">
                      <Upload size={28} />
                    </div>
                    <p className="font-bold text-foreground text-lg mb-1">{isDragActive ? 'Drop image here' : 'Drag & drop a leaf photo'}</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                    <p className="text-xs text-muted-foreground/60 mt-4 font-medium uppercase tracking-widest">JPG, PNG, WEBP · Max 10 MB</p>
                  </div>
                )}
              </div>

              {preview && !detect.isLoading && (
                <Button variant="outline" onClick={(e) => { e.stopPropagation(); setPreview(null); detect.reset(); }} className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                  Clear & Upload New Image
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="bg-primary/5 rounded-2xl p-4 text-sm text-foreground border border-primary/20 shadow-sm flex items-start gap-4">
            <span className="text-2xl drop-shadow-sm mt-1">📸</span>
            <div>
              <p className="font-bold mb-1">Tips for optimal results</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside font-medium marker:text-primary">
                <li>Use natural daylight, avoid harsh flash or shadows.</li>
                <li>Capture the entire leaf, including the edges.</li>
                <li>Ensure the photo is sharp and in focus.</li>
                <li>Center the visible symptoms in the frame.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Result Column */}
        <div className="h-full">
          {result ? (
            <Card className="h-full shadow-sm animate-fade-in border-border/50 flex flex-col">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Analysis Result</CardTitle>
                  <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", sevCls)}>
                    {result.severity === 'none' || result.severity === 'low' ? <CheckCircle size={14} /> :
                     result.severity === 'critical' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                    {result.severity}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col space-y-6">
                <div className={cn("p-5 rounded-2xl border shadow-inner", sevCls)}>
                  <p className="text-2xl font-black tracking-tight mb-1">{result.disease}</p>
                  <p className="text-sm font-medium opacity-80">AI Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
                    <span>Confidence Level</span><span>{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                    <div className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.confidence * 100}%` }} />
                  </div>
                </div>

                {result.affected_area_percent !== undefined && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">Estimated Affected Area</p>
                    <p className="text-3xl font-black text-foreground">{result.affected_area_percent.toFixed(1)}<span className="text-xl text-muted-foreground">%</span></p>
                  </div>
                )}

                <div className="flex-1 bg-accent/30 border border-border/60 rounded-2xl p-5 flex flex-col">
                  <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"/> Recommended Treatment
                  </p>
                  <div className="text-sm text-foreground/80 leading-relaxed font-medium bg-background/50 rounded-xl p-4 flex-1 border border-border/30 shadow-sm">
                    {result.treatment}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !detect.isLoading ? (
            <Card className="h-full shadow-sm border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/50">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner text-4xl grayscale opacity-50">🌿</div>
              <h3 className="font-bold text-lg text-foreground mb-2">Awaiting Image</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">Upload a leaf photo using the panel to see the AI analysis results here.</p>
              <div className="mt-8 px-4 py-2 bg-background border border-border rounded-full text-xs font-bold text-muted-foreground uppercase tracking-widest shadow-sm">
                Supports 38+ Crop Diseases
              </div>
            </Card>
          ) : (
             <Card className="h-full shadow-sm border-border flex flex-col p-6 animate-pulse">
                <Skeleton className="h-10 w-1/3 mb-6" />
                <Skeleton className="h-24 w-full rounded-2xl mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-6" />
                <Skeleton className="h-40 w-full rounded-2xl flex-1" />
             </Card>
          )}
        </div>
      </div>

      {/* History table */}
      {historyLoading ? (
         <div className="mt-10 space-y-4">
           <Skeleton className="h-8 w-48 mb-4" />
           <Skeleton className="h-40 w-full rounded-2xl" />
         </div>
      ) : (history?.results?.length ?? 0) > 0 && (
        <div className="mt-10 animate-fade-in">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight text-xl">
            <History size={20} className="text-primary" /> Detection History
          </h3>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Disease Detected</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history!.results!.map((r) => (
                    <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{r.disease_name}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border", SEV[(r.severity as SevKey) ?? 'moderate'])}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                           {(r.confidence * 100).toFixed(0)}%
                           <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                             <div className="h-full bg-primary" style={{ width: `${r.confidence * 100}%` }} />
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                        {format(new Date(r.timestamp), 'MMM d, yyyy • h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
