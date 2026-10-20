# Backend — 3 petites modifications

## 1. Contrôleur
Copier SignatureController.php vers laravel-setup/app/Http/Controllers/Api/

## 2. routes/api.php
Dans le `use App\Http\Controllers\Api\{ ... }` ajouter : `SignatureController,`
Dans le groupe auth:sanctum, à côté des routes /inspections/{inspection}/... :
```php
Route::get('/inspections/{inspection}/signatures', [SignatureController::class, 'index']);
Route::post('/inspections/{inspection}/signatures', [SignatureController::class, 'store']);
```

## 3. Signatures dans le rapport PDF (2 retouches)

**app/Services/RapportPdfService.php**
- Dans `$inspection->load([...])` ajouter `'signatures'`
- Dans le tableau passé à `Pdf::loadView(...)` ajouter :
```php
'signatures_base64' => $this->signaturesEnBase64($inspection),
```
- Ajouter la méthode :
```php
private function signaturesEnBase64(Inspection $inspection): array
{
    $resultat = [];
    foreach ($inspection->signatures as $s) {
        if (Storage::disk('public')->exists($s->chemin_fichier)) {
            $resultat[$s->type_signataire] = [
                'nom' => $s->nom,
                'image' => 'data:image/png;base64,' . base64_encode(Storage::disk('public')->get($s->chemin_fichier)),
            ];
        }
    }
    return $resultat;
}
```

**resources/views/rapports/inspection.blade.php** — dans le tableau `zone-signature` (page 1) :
- sous `{{ $inspection->equipement->localisation ?? ... }}` (colonne gauche) rien à changer ;
- dans la colonne « Inspecteurs levage », après `{{ $inspection->inspecteur->nom }}`, ajouter :
```blade
@if(isset($signatures_base64['inspecteur']))
    <br><img src="{{ $signatures_base64['inspecteur']['image'] }}" style="max-height:50px; max-width:160px;">
@endif
```
- et, dans la colonne gauche (sous l'adresse), la signature du client :
```blade
@if(isset($signatures_base64['client']))
    <br><span style="font-size:9px;">Pour le client : {{ $signatures_base64['client']['nom'] }}</span><br>
    <img src="{{ $signatures_base64['client']['image'] }}" style="max-height:50px; max-width:160px;">
@endif
```

Puis : `docker compose -f docker-compose.prod.yml up -d --build app` + `exec app php artisan route:clear && php artisan route:cache && php artisan view:clear`
