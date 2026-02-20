import { supabaseConfig } from '../config/supabase.config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Inicializar Supabase
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Estado Global
let currentAdmin = null;
let stats = {
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    totalUsers: 0
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadAdminData();
    await loadDashboardStats();
    await loadRecentLicenses();
    setupEventListeners();
});

// ============================================
// AUTENTICAÇÃO
// ============================================
function checkAuth() {
    const adminData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
    if (!adminData) {
        window.location.href = './index.html';
        return;
    }
    currentAdmin = JSON.parse(adminData);
}

async function loadAdminData() {
    if (!currentAdmin) return;
    
    document.getElementById('userName').textContent = currentAdmin.full_name || currentAdmin.username;
    document.getElementById('userEmail').textContent = currentAdmin.email;
    
    // Primeira letra do nome para o avatar
    const initial = (currentAdmin.full_name || currentAdmin.username).charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = initial;
}

// ============================================
// NAVEGAÇÃO
// ============================================
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Generator Form
    document.getElementById('generatorForm').addEventListener('submit', handleGenerateKeys);

    // Copy All Keys
    document.getElementById('copyAllKeysBtn').addEventListener('click', copyAllKeys);
}

window.navigateTo = function(page) {
    // Remover active de todos os nav-items e pages
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.page-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar active no nav-item e page correspondente
    const navItem = document.querySelector(`[data-page="${page}"]`);
    const pageContent = document.getElementById(`${page}Page`);
    
    if (navItem) navItem.classList.add('active');
    if (pageContent) pageContent.classList.add('active');
};

function logout() {
    sessionStorage.removeItem('adminData');
    localStorage.removeItem('adminData');
    window.location.href = './index.html';
}

// ============================================
// DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
    showLoading();
    
    try {
        // Buscar estatísticas
        const { data: statsData, error } = await supabase
            .from('v_dashboard_stats')
            .select('*')
            .single();

        if (error) throw error;

        stats = {
            totalLicenses: statsData.total_licenses || 0,
            activeLicenses: statsData.active_licenses || 0,
            expiredLicenses: statsData.expired_licenses || 0,
            totalUsers: statsData.total_users || 0
        };

        // Atualizar UI
        document.getElementById('totalLicenses').textContent = stats.totalLicenses;
        document.getElementById('activeLicenses').textContent = stats.activeLicenses;
        document.getElementById('expiredLicenses').textContent = stats.expiredLicenses;
        document.getElementById('totalUsers').textContent = stats.totalUsers;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    } finally {
        hideLoading();
    }
}

async function loadRecentLicenses() {
    try {
        const { data: licenses, error } = await supabase
            .from('v_licenses_full')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const tbody = document.getElementById('recentLicensesTable');
        
        if (!licenses || licenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
                        Nenhuma licença encontrada
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = licenses.map(license => `
            <tr>
                <td><code>${license.license_key}</code></td>
                <td><span class="badge badge-info">${getLicenseTypeLabel(license.license_type)}</span></td>
                <td>${getStatusBadge(license.status, license.is_expired)}</td>
                <td>${license.user_email || '<em>Não atribuído</em>'}</td>
                <td>${formatDate(license.created_at)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar licenças recentes:', error);
    }
}

// ============================================
// GERADOR DE CHAVES
// ============================================
async function handleGenerateKeys(e) {
    e.preventDefault();
    
    const licenseType = document.getElementById('genLicenseType').value;
    const maxDevices = parseInt(document.getElementById('genMaxDevices').value);
    const userEmail = document.getElementById('genUserEmail').value.trim();
    const userName = document.getElementById('genUserName').value.trim();
    const quantity = parseInt(document.getElementById('genQuantity').value);
    const notes = document.getElementById('genNotes').value.trim();

    if (!licenseType) {
        showAlert('Por favor, selecione o tipo de licença', 'danger', 'generatorAlert');
        return;
    }

    showLoading();

    try {
        let userId = null;

        // Se email foi fornecido, criar ou buscar usuário
        if (userEmail) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (existingUser) {
                userId = existingUser.id;
            } else if (userName) {
                const { data: newUser, error: userError } = await supabase
                    .from('users')
                    .insert({
                        email: userEmail,
                        full_name: userName,
                        created_by: currentAdmin.id
                    })
                    .select()
                    .single();

                if (userError) throw userError;
                userId = newUser.id;
            }
        }

        // Calcular data de expiração
        const expiresAt = calculateExpirationDate(licenseType);

        // Gerar licenças
        const generatedKeys = [];
        
        for (let i = 0; i < quantity; i++) {
            // Gerar chave única
            const licenseKey = await generateUniqueLicenseKey();

            const { data: license, error: licenseError } = await supabase
                .from('licenses')
                .insert({
                    license_key: licenseKey,
                    user_id: userId,
                    license_type: licenseType,
                    status: 'active',
                    max_devices: maxDevices,
                    is_active: true,
                    expires_at: expiresAt,
                    created_by: currentAdmin.id,
                    notes: notes
                })
                .select()
                .single();

            if (licenseError) throw licenseError;

            generatedKeys.push(license);
        }

        // Registrar log
        await supabase.from('audit_logs').insert({
            admin_id: currentAdmin.id,
            action: 'generate_licenses',
            entity_type: 'license',
            details: {
                quantity: quantity,
                type: licenseType,
                user_email: userEmail
            }
        });

        // Mostrar chaves geradas
        displayGeneratedKeys(generatedKeys);

        // Limpar formulário
        document.getElementById('generatorForm').reset();

        showAlert('Licenças geradas com sucesso!', 'success', 'generatorAlert');

        // Atualizar stats
        await loadDashboardStats();

    } catch (error) {
        console.error('Erro ao gerar licenças:', error);
        showAlert('Erro ao gerar licenças: ' + error.message, 'danger', 'generatorAlert');
    } finally {
        hideLoading();
    }
}

async function generateUniqueLicenseKey() {
    let isUnique = false;
    let key = '';

    while (!isUnique) {
        key = 'ORIG-' + 
              generateRandomString(4) + '-' +
              generateRandomString(4) + '-' +
              generateRandomString(4) + '-' +
              generateRandomString(4);

        const { data } = await supabase
            .from('licenses')
            .select('id')
            .eq('license_key', key)
            .single();

        isUnique = !data;
    }

    return key;
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function calculateExpirationDate(type) {
    const now = new Date();
    
    switch(type) {
        case 'trial':
            return new Date(now.setDate(now.getDate() + 7)).toISOString();
        case 'monthly':
            return new Date(now.setDate(now.getDate() + 30)).toISOString();
        case 'yearly':
            return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
        case 'lifetime':
            return null;
        default:
            return null;
    }
}

function displayGeneratedKeys(keys) {
    const container = document.getElementById('generatedKeysList');
    const box = document.getElementById('generatedKeysBox');

    container.innerHTML = keys.map((key, index) => `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Chave ${index + 1}:</strong>
                    <code style="background: white; padding: 5px 10px; border-radius: 4px; margin-left: 10px; font-size: 14px;">
                        ${key.license_key}
                    </code>
                </div>
                <button class="btn btn-outline" onclick="copyToClipboard('${key.license_key}')" style="padding: 8px 15px;">
                    📋 Copiar
                </button>
            </div>
            <div style="margin-top: 10px; font-size: 13px; color: #666;">
                <span class="badge badge-info">${getLicenseTypeLabel(key.license_type)}</span>
                <span style="margin-left: 10px;">Expira em: ${key.expires_at ? formatDate(key.expires_at) : 'Nunca'}</span>
            </div>
        </div>
    `).join('');

    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth' });
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Chave copiada!', 'success', 'generatorAlert');
    });
};

function copyAllKeys() {
    const keys = Array.from(document.querySelectorAll('#generatedKeysList code'))
        .map(el => el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(keys).then(() => {
        showAlert('Todas as chaves copiadas!', 'success', 'generatorAlert');
    });
}

// ============================================
// UTILITÁRIOS
// ============================================
function getLicenseTypeLabel(type) {
    const types = {
        'trial': 'Trial',
        'monthly': 'Mensal',
        'yearly': 'Anual',
        'lifetime': 'Vitalícia'
    };
    return types[type] || type;
}

function getStatusBadge(status, isExpired) {
    if (isExpired) {
        return '<span class="badge badge-warning">Expirada</span>';
    }
    
    const badges = {
        'active': '<span class="badge badge-success">Ativa</span>',
        'expired': '<span class="badge badge-warning">Expirada</span>',
        'suspended': '<span class="badge badge-danger">Suspensa</span>',
        'revoked': '<span class="badge badge-danger">Revogada</span>'
    };
    
    return badges[status] || `<span class="badge badge-info">${status}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showAlert(message, type = 'success', elementId = 'generatorAlert') {
    const alert = document.getElementById(elementId);
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}
