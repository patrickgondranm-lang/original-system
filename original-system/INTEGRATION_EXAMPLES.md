# 💻 EXEMPLOS DE INTEGRAÇÃO - ORIGINAL SYSTEM

Exemplos práticos de como integrar o sistema de licenças em diferentes linguagens e plataformas.

## 📚 Índice

- [JavaScript/Node.js](#javascriptnodejs)
- [Python](#python)
- [C#/.NET](#cnet)
- [PHP](#php)
- [Java](#java)
- [Electron (Desktop)](#electron-desktop)
- [React Native (Mobile)](#react-native-mobile)

---

## JavaScript/Node.js

### Instalação
```bash
npm install @supabase/supabase-js
```

### Código Completo
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqrwjassqebxjtnzppku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Sua anon key
);

class LicenseManager {
  constructor() {
    this.licenseKey = null;
  }

  // Validar licença
  async validate(licenseKey) {
    try {
      const { data, error } = await supabase
        .rpc('validate_license', {
          p_license_key: licenseKey
        });

      if (error) throw error;

      const result = data[0];
      
      if (!result.is_valid) {
        throw new Error(result.message);
      }

      this.licenseKey = licenseKey;
      await this.registerDevice(result.license_id);
      
      return result;
    } catch (error) {
      console.error('Erro na validação:', error);
      throw error;
    }
  }

  // Registrar dispositivo
  async registerDevice(licenseId) {
    const deviceId = this.getDeviceId();
    
    const { error } = await supabase
      .from('license_usage')
      .upsert({
        license_id: licenseId,
        device_id: deviceId,
        device_name: this.getDeviceName(),
        device_type: 'desktop',
        last_used_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Gerar ID único do dispositivo
  getDeviceId() {
    const os = require('os');
    return require('crypto')
      .createHash('sha256')
      .update(os.hostname() + os.userInfo().username)
      .digest('hex');
  }

  // Nome do dispositivo
  getDeviceName() {
    const os = require('os');
    return os.hostname();
  }
}

// Uso
const license = new LicenseManager();

async function checkLicense() {
  try {
    const result = await license.validate('ORIG-XXXX-XXXX-XXXX-XXXX');
    console.log('Licença válida!', result);
    // Iniciar aplicação
  } catch (error) {
    console.error('Licença inválida:', error.message);
    // Mostrar tela de ativação
  }
}

checkLicense();
```

---

## Python

### Instalação
```bash
pip install supabase-py
```

### Código Completo
```python
import os
import hashlib
import platform
from supabase import create_client, Client
from datetime import datetime

class LicenseManager:
    def __init__(self):
        url = "https://vqrwjassqebxjtnzppku.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Sua anon key
        self.supabase: Client = create_client(url, key)
        self.license_key = None

    def validate(self, license_key: str) -> dict:
        """Validar licença"""
        try:
            response = self.supabase.rpc(
                'validate_license',
                {'p_license_key': license_key}
            ).execute()

            result = response.data[0]

            if not result['is_valid']:
                raise Exception(result['message'])

            self.license_key = license_key
            self.register_device(result['license_id'])

            return result

        except Exception as e:
            print(f"Erro na validação: {e}")
            raise

    def register_device(self, license_id: str):
        """Registrar dispositivo"""
        device_id = self.get_device_id()

        self.supabase.table('license_usage').upsert({
            'license_id': license_id,
            'device_id': device_id,
            'device_name': self.get_device_name(),
            'device_type': 'desktop',
            'last_used_at': datetime.utcnow().isoformat()
        }).execute()

    def get_device_id(self) -> str:
        """Gerar ID único do dispositivo"""
        machine_id = f"{platform.node()}{os.getlogin()}"
        return hashlib.sha256(machine_id.encode()).hexdigest()

    def get_device_name(self) -> str:
        """Nome do dispositivo"""
        return platform.node()

# Uso
license = LicenseManager()

try:
    result = license.validate('ORIG-XXXX-XXXX-XXXX-XXXX')
    print('Licença válida!', result)
    # Iniciar aplicação
except Exception as e:
    print('Licença inválida:', str(e))
    # Mostrar tela de ativação
```

---

## C#/.NET

### Instalação (NuGet)
```bash
Install-Package Supabase
```

### Código Completo
```csharp
using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Supabase;

public class LicenseManager
{
    private readonly Supabase.Client _supabase;
    private string _licenseKey;

    public LicenseManager()
    {
        var url = "https://vqrwjassqebxjtnzppku.supabase.co";
        var key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Sua anon key
        
        _supabase = new Supabase.Client(url, key);
        _supabase.InitializeAsync().Wait();
    }

    public async Task<bool> ValidateAsync(string licenseKey)
    {
        try
        {
            var response = await _supabase
                .Rpc("validate_license", new { p_license_key = licenseKey });

            var result = response.Content;
            
            if (result == null || !result["is_valid"].GetBoolean())
            {
                throw new Exception(result?["message"]?.GetString() ?? "Licença inválida");
            }

            _licenseKey = licenseKey;
            await RegisterDeviceAsync(result["license_id"].GetString());

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro na validação: {ex.Message}");
            return false;
        }
    }

    private async Task RegisterDeviceAsync(string licenseId)
    {
        var deviceId = GetDeviceId();

        await _supabase.From<LicenseUsage>()
            .Upsert(new LicenseUsage
            {
                LicenseId = licenseId,
                DeviceId = deviceId,
                DeviceName = Environment.MachineName,
                DeviceType = "desktop",
                LastUsedAt = DateTime.UtcNow
            });
    }

    private string GetDeviceId()
    {
        var machineId = $"{Environment.MachineName}{Environment.UserName}";
        
        using (var sha256 = SHA256.Create())
        {
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(machineId));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }
    }
}

// Model
public class LicenseUsage
{
    public string LicenseId { get; set; }
    public string DeviceId { get; set; }
    public string DeviceName { get; set; }
    public string DeviceType { get; set; }
    public DateTime LastUsedAt { get; set; }
}

// Uso
class Program
{
    static async Task Main(string[] args)
    {
        var license = new LicenseManager();

        if (await license.ValidateAsync("ORIG-XXXX-XXXX-XXXX-XXXX"))
        {
            Console.WriteLine("Licença válida!");
            // Iniciar aplicação
        }
        else
        {
            Console.WriteLine("Licença inválida!");
            // Mostrar tela de ativação
        }
    }
}
```

---

## PHP

### Instalação (Composer)
```bash
composer require supabase/supabase-php
```

### Código Completo
```php
<?php
require 'vendor/autoload.php';

use Supabase\CreateClient;

class LicenseManager {
    private $supabase;
    private $licenseKey;

    public function __construct() {
        $this->supabase = CreateClient(
            'https://vqrwjassqebxjtnzppku.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Sua anon key
        );
    }

    public function validate($licenseKey) {
        try {
            $response = $this->supabase
                ->rpc('validate_license', [
                    'p_license_key' => $licenseKey
                ])
                ->execute();

            $result = $response->data[0];

            if (!$result->is_valid) {
                throw new Exception($result->message);
            }

            $this->licenseKey = $licenseKey;
            $this->registerDevice($result->license_id);

            return $result;

        } catch (Exception $e) {
            error_log("Erro na validação: " . $e->getMessage());
            throw $e;
        }
    }

    private function registerDevice($licenseId) {
        $deviceId = $this->getDeviceId();

        $this->supabase
            ->from('license_usage')
            ->upsert([
                'license_id' => $licenseId,
                'device_id' => $deviceId,
                'device_name' => gethostname(),
                'device_type' => 'web',
                'last_used_at' => date('c')
            ])
            ->execute();
    }

    private function getDeviceId() {
        $machineId = gethostname() . get_current_user();
        return hash('sha256', $machineId);
    }
}

// Uso
$license = new LicenseManager();

try {
    $result = $license->validate('ORIG-XXXX-XXXX-XXXX-XXXX');
    echo "Licença válida!\n";
    // Iniciar aplicação
} catch (Exception $e) {
    echo "Licença inválida: " . $e->getMessage() . "\n";
    // Mostrar tela de ativação
}
?>
```

---

## Java

### Dependências (Maven)
```xml
<dependency>
    <groupId>io.github.jan-tennert.supabase</groupId>
    <artifactId>postgrest-kt</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Código Completo
```java
import io.github.jan.supabase.SupabaseClient;
import io.github.jan.supabase.SupabaseClientBuilder;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

public class LicenseManager {
    private SupabaseClient supabase;
    private String licenseKey;

    public LicenseManager() {
        this.supabase = new SupabaseClientBuilder()
            .supabaseUrl("https://vqrwjassqebxjtnzppku.supabase.co")
            .supabaseKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...") // Sua anon key
            .build();
    }

    public Map<String, Object> validate(String licenseKey) throws Exception {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("p_license_key", licenseKey);

            Map<String, Object> response = supabase
                .rpc("validate_license", params)
                .execute();

            Map<String, Object> result = (Map<String, Object>) response.get("data");

            if (!(boolean) result.get("is_valid")) {
                throw new Exception((String) result.get("message"));
            }

            this.licenseKey = licenseKey;
            registerDevice((String) result.get("license_id"));

            return result;

        } catch (Exception e) {
            System.err.println("Erro na validação: " + e.getMessage());
            throw e;
        }
    }

    private void registerDevice(String licenseId) throws Exception {
        String deviceId = getDeviceId();

        Map<String, Object> usage = new HashMap<>();
        usage.put("license_id", licenseId);
        usage.put("device_id", deviceId);
        usage.put("device_name", System.getenv("COMPUTERNAME"));
        usage.put("device_type", "desktop");
        usage.put("last_used_at", java.time.Instant.now().toString());

        supabase.from("license_usage").upsert(usage).execute();
    }

    private String getDeviceId() throws Exception {
        String machineId = System.getenv("COMPUTERNAME") + 
                          System.getProperty("user.name");
        
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(machineId.getBytes());
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            hexString.append(String.format("%02x", b));
        }
        
        return hexString.toString();
    }

    // Uso
    public static void main(String[] args) {
        LicenseManager license = new LicenseManager();

        try {
            Map<String, Object> result = license.validate("ORIG-XXXX-XXXX-XXXX-XXXX");
            System.out.println("Licença válida!");
            // Iniciar aplicação
        } catch (Exception e) {
            System.err.println("Licença inválida: " + e.getMessage());
            // Mostrar tela de ativação
        }
    }
}
```

---

## Electron (Desktop)

### package.json
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "electron": "^latest",
    "electron-store": "^8.0.0"
  }
}
```

### main.js
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const os = require('os');

const store = new Store();
const supabase = createClient(
  'https://vqrwjassqebxjtnzppku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Sua anon key
);

// Validar licença
ipcMain.handle('validate-license', async (event, licenseKey) => {
  try {
    const { data, error } = await supabase
      .rpc('validate_license', { p_license_key: licenseKey });

    if (error) throw error;

    const result = data[0];

    if (!result.is_valid) {
      throw new Error(result.message);
    }

    // Salvar licença
    store.set('licenseKey', licenseKey);

    // Registrar dispositivo
    await registerDevice(result.license_id);

    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Registrar dispositivo
async function registerDevice(licenseId) {
  const deviceId = getDeviceId();

  await supabase.from('license_usage').upsert({
    license_id: licenseId,
    device_id: deviceId,
    device_name: os.hostname(),
    device_type: 'desktop',
    last_used_at: new Date().toISOString()
  });
}

// ID do dispositivo
function getDeviceId() {
  const machineId = `${os.hostname()}${os.userInfo().username}`;
  return crypto.createHash('sha256').update(machineId).digest('hex');
}

// Criar janela
function createWindow() {
  const savedLicense = store.get('licenseKey');

  if (!savedLicense) {
    // Mostrar janela de ativação
    createActivationWindow();
  } else {
    // Validar licença salva
    validateSavedLicense(savedLicense);
  }
}

app.whenReady().then(createWindow);
```

---

## React Native (Mobile)

### Instalação
```bash
npm install @supabase/supabase-js react-native-device-info
```

### LicenseService.js
```javascript
import { createClient } from '@supabase/supabase-js';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(
  'https://vqrwjassqebxjtnzppku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Sua anon key
);

export class LicenseService {
  static async validate(licenseKey) {
    try {
      const { data, error } = await supabase
        .rpc('validate_license', { p_license_key: licenseKey });

      if (error) throw error;

      const result = data[0];

      if (!result.is_valid) {
        throw new Error(result.message);
      }

      // Salvar licença
      await AsyncStorage.setItem('licenseKey', licenseKey);

      // Registrar dispositivo
      await this.registerDevice(result.license_id);

      return result;

    } catch (error) {
      console.error('Erro na validação:', error);
      throw error;
    }
  }

  static async registerDevice(licenseId) {
    const deviceId = await DeviceInfo.getUniqueId();
    const deviceName = await DeviceInfo.getDeviceName();
    const deviceType = await DeviceInfo.getDeviceType();

    await supabase.from('license_usage').upsert({
      license_id: licenseId,
      device_id: deviceId,
      device_name: deviceName,
      device_type: deviceType.toLowerCase(),
      last_used_at: new Date().toISOString()
    });
  }

  static async getSavedLicense() {
    return await AsyncStorage.getItem('licenseKey');
  }

  static async removeLicense() {
    await AsyncStorage.removeItem('licenseKey');
  }
}
```

### App.js (Uso)
```javascript
import React, { useEffect, useState } from 'react';
import { LicenseService } from './LicenseService';

export default function App() {
  const [isLicensed, setIsLicensed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  async function checkLicense() {
    try {
      const savedLicense = await LicenseService.getSavedLicense();

      if (savedLicense) {
        await LicenseService.validate(savedLicense);
        setIsLicensed(true);
      }
    } catch (error) {
      console.error('Licença inválida:', error);
      setIsLicensed(false);
    } finally {
      setLoading(false);
    }
  }

  async function activateLicense(licenseKey) {
    try {
      await LicenseService.validate(licenseKey);
      setIsLicensed(true);
    } catch (error) {
      alert('Licença inválida: ' + error.message);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!isLicensed) return <ActivationScreen onActivate={activateLicense} />;
  
  return <MainApp />;
}
```

---

## 🎯 Dicas Gerais

### Segurança
- Nunca exponha o `serviceRoleKey` no frontend
- Use apenas o `anonKey` no cliente
- Implemente rate limiting
- Hash os device IDs
- Use HTTPS em produção

### Performance
- Cache a validação localmente
- Valide apenas na inicialização
- Use workers/background jobs para registro de uso

### UX
- Mostre mensagens claras de erro
- Ofereça modo offline (com validação periódica)
- Implemente retry automático
- Salve a licença localmente após validação

---

**Original System** - Exemplos de Integração
Para mais informações, consulte o README.md principal.
