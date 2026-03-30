"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Images, Pencil, Plus, ShoppingCart, Star, Trash2 } from "lucide-react";
import { deleteMediaAsset, updateMediaAsset, uploadMediaAsset } from "@/lib/actions/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface MediaRow {
  id: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  album: string | null;
  preview_url: string | null;
  price_label: string | null;
  purchase_url: string | null;
  sort_order: number;
  is_visible: boolean;
  download_enabled: boolean;
  is_featured: boolean;
  created_at: string;
}

const emptyEditState = {
  id: "",
  title: "",
  caption: "",
  altText: "",
  album: "",
  priceLabel: "",
  purchaseUrl: "",
  sortOrder: 0,
  isVisible: true,
  isFeatured: false,
  downloadEnabled: false,
};

export function MediaClient({ mediaItems }: { mediaItems: MediaRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(emptyEditState);
  const uploadFormRef = useRef<HTMLFormElement | null>(null);

  const stats = useMemo(
    () => ({
      total: mediaItems.length,
      visible: mediaItems.filter((item) => item.is_visible).length,
      featured: mediaItems.filter((item) => item.is_featured).length,
      purchasable: mediaItems.filter((item) => item.purchase_url).length,
    }),
    [mediaItems],
  );

  function openEdit(item: MediaRow) {
    setEditing({
      id: item.id,
      title: item.title ?? "",
      caption: item.caption ?? "",
      altText: item.alt_text ?? "",
      album: item.album ?? "",
      priceLabel: item.price_label ?? "",
      purchaseUrl: item.purchase_url ?? "",
      sortOrder: item.sort_order,
      isVisible: item.is_visible,
      isFeatured: item.is_featured,
      downloadEnabled: item.download_enabled,
    });
    setDialogOpen(true);
  }

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const result = await uploadMediaAsset(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Imagen subida a la galeria");
      uploadFormRef.current?.reset();
      router.refresh();
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateMediaAsset({
        id: editing.id,
        title: editing.title,
        caption: editing.caption,
        altText: editing.altText,
        album: editing.album,
        priceLabel: editing.priceLabel,
        purchaseUrl: editing.purchaseUrl,
        sortOrder: editing.sortOrder,
        isVisible: editing.isVisible,
        isFeatured: editing.isFeatured,
        downloadEnabled: editing.downloadEnabled,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Elemento multimedia actualizado");
      setDialogOpen(false);
      setEditing(emptyEditState);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar esta imagen de la galeria?")) return;

    startTransition(async () => {
      const result = await deleteMediaAsset({ id });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Imagen eliminada");
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Images size={16} />
              Biblioteca
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye size={16} />
              Publicas
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{stats.visible}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star size={16} />
              Destacadas
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{stats.featured}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart size={16} />
              Con compra
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{stats.purchasable}</p>
          </div>
        </div>

        <form
          ref={uploadFormRef}
          action={handleUpload}
          className="grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Subir nueva imagen</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                La galeria publica usa estas fotos para mostrar, descargar o
                vender imagenes del evento.
              </p>
            </div>
            <Badge variant="outline" className="border-brand-green/30 text-brand-green">
              15 MB max
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="media-file">Archivo</Label>
              <Input id="media-file" name="file" type="file" accept="image/*" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-title">Titulo</Label>
              <Input id="media-title" name="title" placeholder="Final arena - Sabado tarde" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-album">Album</Label>
              <Input id="media-album" name="album" placeholder="Sabado / Finales / Warm up" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-price-label">Precio visible</Label>
              <Input id="media-price-label" name="priceLabel" placeholder="Desde 8 EUR" />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="media-purchase-url">URL de compra</Label>
              <Input
                id="media-purchase-url"
                name="purchaseUrl"
                type="url"
                placeholder="https://checkout.tu-fotografo.com/galeria/finales"
              />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="media-caption">Texto de apoyo</Label>
              <Textarea
                id="media-caption"
                name="caption"
                rows={3}
                placeholder="Momento de esfuerzo, celebracion o ambiente para acompanar la foto."
              />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="media-alt-text">Texto alternativo</Label>
              <Input
                id="media-alt-text"
                name="altText"
                placeholder="Equipo levantando la barra durante el ultimo bloque del heat"
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="media-sort-order">Orden</Label>
              <Input id="media-sort-order" name="sortOrder" type="number" min={0} max={999} defaultValue={0} />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Visible</p>
                <p className="text-xs text-muted-foreground">Se muestra en galeria publica</p>
              </div>
              <input
                type="checkbox"
                name="isVisible"
                defaultChecked
                className="h-4 w-4 accent-[var(--color-brand-green)]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Destacada</p>
                <p className="text-xs text-muted-foreground">Prioridad en home y galeria</p>
              </div>
              <input
                type="checkbox"
                name="isFeatured"
                className="h-4 w-4 accent-[var(--color-brand-green)]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Descarga habilitada</p>
                <p className="text-xs text-muted-foreground">Activa el boton de descargar</p>
              </div>
              <input
                type="checkbox"
                name="downloadEnabled"
                className="h-4 w-4 accent-[var(--color-brand-green)]"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              <Plus data-icon="inline-start" />
              {isPending ? "Subiendo..." : "Subir a galeria"}
            </Button>
          </div>
        </form>

        {mediaItems.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {mediaItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80"
              >
                {item.preview_url ? (
                  <div className="relative aspect-[4/3] bg-background/60">
                    <Image
                      src={item.preview_url}
                      alt={item.alt_text ?? item.title ?? "Imagen de galeria"}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-background/60 text-sm text-muted-foreground">
                    Sin preview
                  </div>
                )}

                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">
                          {item.title ?? "Sin titulo"}
                        </p>
                        {item.is_featured && (
                          <Badge className="border-brand-green/20 bg-brand-green/10 text-brand-green">
                            Destacada
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            item.is_visible
                              ? "border-brand-green/30 text-brand-green"
                              : "text-muted-foreground"
                          }
                        >
                          {item.is_visible ? "Visible" : "Oculta"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.album && <span>{item.album}</span>}
                        <span>
                          {new Date(item.created_at).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  {item.caption && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.caption}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-muted-foreground">
                      Orden {item.sort_order}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.download_enabled
                          ? "border-brand-cyan/30 text-brand-cyan"
                          : "text-muted-foreground"
                      }
                    >
                      {item.download_enabled ? "Descargable" : "Sin descarga"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.purchase_url
                          ? "border-brand-green/30 text-brand-green"
                          : "text-muted-foreground"
                      }
                    >
                      {item.purchase_url ? "Compra disponible" : "Sin compra"}
                    </Badge>
                  </div>

                  {item.price_label && (
                    <p className="text-sm font-medium text-foreground">
                      {item.price_label}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            Todavia no hay fotos subidas a la galeria.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar elemento multimedia</DialogTitle>
            <DialogDescription>
              Ajusta la visibilidad, la descarga y la compra sin volver a subir la imagen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="edit-media-title">Titulo</Label>
              <Input
                id="edit-media-title"
                value={editing.title}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-media-album">Album</Label>
              <Input
                id="edit-media-album"
                value={editing.album}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, album: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-media-sort-order">Orden</Label>
              <Input
                id="edit-media-sort-order"
                type="number"
                min={0}
                max={999}
                value={editing.sortOrder}
                onChange={(event) =>
                  setEditing((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="edit-media-caption">Texto de apoyo</Label>
              <Textarea
                id="edit-media-caption"
                rows={3}
                value={editing.caption}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, caption: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="edit-media-alt-text">Texto alternativo</Label>
              <Input
                id="edit-media-alt-text"
                value={editing.altText}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, altText: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-media-price-label">Precio visible</Label>
              <Input
                id="edit-media-price-label"
                value={editing.priceLabel}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, priceLabel: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-media-purchase-url">URL de compra</Label>
              <Input
                id="edit-media-purchase-url"
                type="url"
                value={editing.purchaseUrl}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, purchaseUrl: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Visible en web</p>
                  <p className="text-xs text-muted-foreground">
                    Si lo desactivas, desaparece de la galeria publica.
                  </p>
                </div>
                <Switch
                  checked={editing.isVisible}
                  onCheckedChange={(checked) =>
                    setEditing((current) => ({ ...current, isVisible: checked }))
                  }
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Destacada</p>
                  <p className="text-xs text-muted-foreground">
                    Prioriza la imagen en home y en la cabecera de la galeria.
                  </p>
                </div>
                <Switch
                  checked={editing.isFeatured}
                  onCheckedChange={(checked) =>
                    setEditing((current) => ({ ...current, isFeatured: checked }))
                  }
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Descarga habilitada</p>
                  <p className="text-xs text-muted-foreground">
                    Muestra el boton para bajar la imagen desde la web.
                  </p>
                </div>
                <Switch
                  checked={editing.downloadEnabled}
                  onCheckedChange={(checked) =>
                    setEditing((current) => ({
                      ...current,
                      downloadEnabled: checked,
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
