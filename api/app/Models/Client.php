<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'nom', 'adresse', 'contact', 'telephone', 'email', 'reference_client',
    ];

    public function sites()
    {
        return $this->hasMany(Site::class);
    }
}
