import React, { useState } from 'react';
import { Tag, FileCode, Edit, Check, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AnnotationsSection = () => {
  const [activeTab, setActiveTab] = useState("annotations");
  const [annotations, setAnnotations] = useState([
    { id: 1, name: "Administratif", color: "#3b82f6", count: 125, originalName: "Thème 1: administratif & gestion & procédures" },
    { id: 2, name: "Technique", color: "#ef4444", count: 87, originalName: "Thème 2: technique & matériel & équipement" },
    { id: 3, name: "Financier", color: "#10b981", count: 64, originalName: "Thème 3: finance & budget & économie" },
    { id: 4, name: "Juridique", color: "#f59e0b", count: 42, originalName: "Thème 4: juridique & légal & droit" },
    { id: 5, name: "Marketing", color: "#8b5cf6", count: 31, originalName: "Thème 5: marketing & communication & promotion" }
  ]);

  const [newAnnotation, setNewAnnotation] = useState({ name: "", color: "#6366f1" });
  const [pipelineStatus, setPipelineStatus] = useState("idle"); // idle, running, completed
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddAnnotation = () => {
    if (newAnnotation.name.trim() === "") return;
    
    setAnnotations([
      ...annotations,
      {
        id: annotations.length + 1,
        name: newAnnotation.name,
        color: newAnnotation.color,
        count: 0,
        originalName: `Thème ${annotations.length + 1}: ${newAnnotation.name}`
      }
    ]);
    
    setNewAnnotation({ name: "", color: "#6366f1" });
  };

  const handleRemoveAnnotation = (id: number) => {
    setAnnotations(annotations.filter(anno => anno.id !== id));
  };

  const handleRunPipeline = () => {
    setPipelineStatus("running");
    setPipelineProgress(0);
    
    // Simuler le progrès du pipeline
    const intervalId = setInterval(() => {
      setPipelineProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          setPipelineStatus("completed");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const startEditing = (annotation) => {
    setEditingId(annotation.id);
    setEditName(annotation.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEditing = (id) => {
    if (editName.trim() === "") return;
    
    setAnnotations(annotations.map(anno => 
      anno.id === id ? { ...anno, name: editName } : anno
    ));
    
    setEditingId(null);
    setEditName("");
  };

  const resetToOriginal = (id) => {
    setAnnotations(annotations.map(anno => 
      anno.id === id ? { ...anno, name: anno.originalName.split(': ')[1] } : anno
    ));
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Tag className="mr-2 h-6 w-6" />
          Annotations et Pipeline
        </h2>
        
        <Tabs 
          defaultValue="annotations" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="annotations">Annotations (Classes)</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline de Généralisation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="annotations" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Ajouter une nouvelle annotation</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="annotation-name">Nom de l'annotation</Label>
                  <Input 
                    id="annotation-name" 
                    placeholder="Ex: Technique" 
                    value={newAnnotation.name}
                    onChange={(e) => setNewAnnotation({...newAnnotation, name: e.target.value})}
                  />
                </div>
                <div className="w-full md:w-32">
                  <Label htmlFor="annotation-color">Couleur</Label>
                  <Input 
                    id="annotation-color" 
                    type="color" 
                    value={newAnnotation.color}
                    onChange={(e) => setNewAnnotation({...newAnnotation, color: e.target.value})}
                    className="h-10 p-1 cursor-pointer"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddAnnotation}>Ajouter</Button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Liste des annotations</h3>
              <Table>
                <TableCaption>Annotations disponibles pour la classification des documents</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead>Annotation</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead className="text-right">Documents</TableHead>
                    <TableHead className="w-[150px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annotations.map((annotation) => (
                    <TableRow key={annotation.id}>
                      <TableCell className="font-medium">{annotation.id}</TableCell>
                      <TableCell>
                        {editingId === annotation.id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 py-1 px-2"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-green-500"
                              onClick={() => saveEditing(annotation.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge style={{ backgroundColor: annotation.color }}>
                                  {annotation.name}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Original: {annotation.originalName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-300" 
                            style={{ backgroundColor: annotation.color }}
                          />
                          {annotation.color}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{annotation.count}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {editingId !== annotation.id && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-blue-500"
                                onClick={() => startEditing(annotation)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-orange-500"
                                onClick={() => resetToOriginal(annotation.id)}
                                title="Restaurer le nom généré par l'IA"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                  <path d="M3 3v5h5"></path>
                                </svg>
                                <span className="sr-only">Restaurer l'original</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveAnnotation(annotation.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="pipeline" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Pipeline de généralisation des annotations</h3>
              <p className="text-gray-600 mb-4">
                Ce pipeline permet de généraliser les annotations existantes à l'ensemble du corpus
                en utilisant des algorithmes d'apprentissage automatique.
              </p>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-2 flex items-center">
                  <FileCode className="h-4 w-4 mr-2" />
                  Configuration
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model-selection">Modèle</Label>
                    <select 
                      id="model-selection" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="svm">Support Vector Machine</option>
                      <option value="bert">BERT</option>
                      <option value="logistic">Régression logistique</option>
                      <option value="random-forest">Random Forest</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="train-ratio">Ratio d'entraînement</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="train-ratio" 
                        type="range" 
                        min="50" 
                        max="90" 
                        defaultValue="80" 
                        className="cursor-pointer"
                      />
                      <span className="w-12 text-center">80%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Button 
                  onClick={handleRunPipeline}
                  disabled={pipelineStatus === "running" || annotations.length === 0}
                  className="mr-2"
                >
                  {pipelineStatus === "completed" ? "Relancer le pipeline" : "Lancer le pipeline"}
                </Button>
                
                {pipelineStatus !== "idle" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression: {pipelineProgress}%</span>
                      {pipelineStatus === "completed" && (
                        <span className="text-green-600 font-medium">Complété</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className={`h-2.5 rounded-full ${pipelineStatus === "completed" ? "bg-green-600" : "bg-blue-600"}`}
                        style={{ width: `${pipelineProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {pipelineStatus === "completed" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Résultats du pipeline</h4>
                  <p className="text-green-700 mb-2">Le pipeline a été exécuté avec succès!</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                    <li>Documents traités: <strong>1,458</strong></li>
                    <li>Précision globale: <strong>87.3%</strong></li>
                    <li>Temps d'exécution: <strong>5 minutes 24 secondes</strong></li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>La section Annotations permet de créer et gérer les classes qui seront utilisées pour catégoriser vos documents.</li>
            <li>Le Pipeline de généralisation utilise les annotations existantes pour entraîner un modèle et catégoriser automatiquement le reste de votre corpus.</li>
            <li>Pour de meilleurs résultats, assurez-vous d'avoir au moins 10-20 exemples annotés par classe avant de lancer le pipeline.</li>
            <li><strong>Astuce:</strong> Vous pouvez renommer les annotations générées automatiquement par l'IA pour les rendre plus explicites et adaptées à vos besoins.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnotationsSection;