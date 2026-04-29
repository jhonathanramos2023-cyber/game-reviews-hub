import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useReviews } from "@/hooks/use-reviews";
import { useList } from "@/hooks/use-list";
import gamesData from "@/data/games.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Stars } from "@/components/stars";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCircle, Settings, Download, Trash2, Edit2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, updateProfile, clearData, colors } = useUser();
  const { reviews, deleteReview } = useReviews();
  const { list } = useList();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.nombre || "");
  const [editBio, setEditBio] = useState(user?.bio || "");

  if (!user) return null;

  const myReviews = reviews.filter(r => r.autor === user.nombre);

  // Calculate favorite genres based on completed games
  const favoriteGenres = (() => {
    const completedList = list.filter(item => item.estado === "completado" || item.estado === "jugando");
    const genreCounts: Record<string, number> = {};
    
    completedList.forEach(item => {
      const game = gamesData.find(g => g.id === item.juegoId);
      if (game) {
        game.generos.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    const total = Object.values(genreCounts).reduce((a, b) => a + b, 0);
    return Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count, percent: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  const handleSaveProfile = () => {
    updateProfile({ nombre: editName, bio: editBio });
    setIsEditing(false);
    toast.success("Perfil actualizado");
  };

  const handleExportData = () => {
    const data = {
      usuario: JSON.parse(localStorage.getItem("gr_usuario") || "null"),
      lista: JSON.parse(localStorage.getItem("gr_lista") || "[]"),
      resenas: JSON.parse(localStorage.getItem("gr_resenas") || "[]"),
      votos: JSON.parse(localStorage.getItem("gr_votos") || "[]"),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gamereviews-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Datos exportados correctamente");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header Profile Card */}
      <Card className="bg-card border-primary/20 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/40 to-background" />
        <CardContent className="px-6 pb-6 relative pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarFallback style={{ backgroundColor: user.avatarColor, color: "#fff", fontSize: "3rem" }}>
                {user.nombre.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-3 pt-4 w-full max-w-md mx-auto md:mx-0">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" className="font-bold text-lg" />
                  <Input value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio corta" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-display font-bold">{user.nombre}</h1>
                  <p className="text-muted-foreground mt-1">{user.bio}</p>
                  <p className="text-xs text-muted-foreground mt-2 opacity-50">
                    Miembro desde {new Date(user.fechaRegistro).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {!isEditing && (
              <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" /> Editar Perfil
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">{list.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">En lista</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">{myReviews.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Reseñas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">{favoriteGenres[0]?.name || "-"}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Género fav</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          {/* Stats & Genres */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" /> ADN Gamer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {favoriteGenres.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Juega más para descubrir tu ADN.</p>
              ) : (
                <div className="space-y-4">
                  {favoriteGenres.map((g, i) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium">{g.name}</span>
                        <span className="text-muted-foreground">{Math.round(g.percent)}%</span>
                      </div>
                      <Progress value={g.percent} className="h-2 bg-muted" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" /> Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Color del Avatar</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full rounded-tr-sm transition-transform hover:scale-110 ${user.avatarColor === color ? 'ring-2 ring-offset-2 ring-background ring-offset-foreground scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateProfile({ avatarColor: color })}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Datos
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4 mr-2" /> Limpiar Datos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-destructive/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Eliminará permanentemente tu perfil, lista de juegos y todas tus reseñas del navegador local.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={clearData}>
                        Sí, borrar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h3 className="text-2xl font-display font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Mis Reseñas
          </h3>
          
          {myReviews.length === 0 ? (
            <Card className="bg-card/50 border-dashed border-border text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Aún no has escrito ninguna reseña.</p>
                <Link href="/">
                  <Button variant="link" className="text-primary mt-2">Buscar un juego para opinar</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myReviews.map(review => {
                const game = gamesData.find(g => g.id === review.juegoId);
                if (!game) return null;
                
                return (
                  <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <Link href={`/juego/${game.id}`} className="shrink-0 bg-muted flex items-center justify-center sm:w-32 aspect-video sm:aspect-auto">
                          <img src={game.imagenBanner || game.imagen} alt={game.nombre} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                        </Link>
                        <CardContent className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Link href={`/juego/${game.id}`}>
                                <h4 className="font-bold hover:text-primary transition-colors">{game.nombre}</h4>
                              </Link>
                              <div className="text-xs text-muted-foreground">{new Date(review.fecha).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stars rating={review.rating} />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 -mr-2"
                                onClick={() => {
                                  deleteReview(review.id);
                                  toast("Reseña eliminada");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-foreground/80 line-clamp-3 mt-2">{review.texto}</p>
                          
                          {review.recomendado && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] mt-3">
                              Recomendado
                            </Badge>
                          )}
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
