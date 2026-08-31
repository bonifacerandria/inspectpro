<?php

/**
 * À AJOUTER dans app/Providers/AppServiceProvider.php, méthode boot() :
 * (fichier non fourni en entier ici pour ne pas écraser d'éventuelles
 * autres personnalisations déjà présentes dans le projet)
 */

use App\Models\{PointControle, SectionControle, PhotoObligatoire, DocumentRequis, EssaiRequis};
use App\Observers\InvalideFormulaireCacheObserver;

public function boot(): void
{
    PointControle::observe(InvalideFormulaireCacheObserver::class);
    SectionControle::observe(InvalideFormulaireCacheObserver::class);
    PhotoObligatoire::observe(InvalideFormulaireCacheObserver::class);
    DocumentRequis::observe(InvalideFormulaireCacheObserver::class);
    EssaiRequis::observe(InvalideFormulaireCacheObserver::class);
}
