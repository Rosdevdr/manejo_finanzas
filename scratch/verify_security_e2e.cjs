const pw = require('C:/Users/jesus/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/jesus/.gemini/antigravity-ide/brain/f56e9934-45f6-4925-84df-7da744e020dd';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  console.log('🚀 Iniciando Playwright con Google Chrome del sistema...');
  
  // Launch Chrome (headful so user can see it live on their desktop!)
  const browser = await pw.chromium.launch({
    executablePath: CHROME_PATH,
    headless: false,
    slowMo: 600, // Slow motion so the user can easily observe every step in real time
    args: ['--window-size=1280,800', '--no-first-run', '--no-default-browser-check']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ Navegando a http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // If on login screen, enter demo mode
    const demoBtn = page.locator('button:has-text("Probar en Modo Demo"), button:has-text("Modo Demo")');
    if (await demoBtn.count() > 0 && await demoBtn.isVisible()) {
      console.log('🔓 Accediendo mediante Modo Demo...');
      await demoBtn.first().click();
      await page.waitForTimeout(1500);
    }

    // Wait for Dashboard to appear
    await page.waitForSelector('.sandbox-view, .app-shell, .dashboard-grid', { timeout: 10000 });
    console.log('✅ Acceso al Dashboard verificado exitosamente.');

    // Screenshot 1: Dashboard
    const snapDashboard = path.join(ARTIFACT_DIR, 'e2e_dashboard.png');
    await page.screenshot({ path: snapDashboard });
    console.log('📸 Captura 1 guardada:', snapDashboard);

    // 2️⃣ Navegar al módulo Gastos
    console.log('2️⃣ Navegando al módulo Gastos...');
    const gastosNav = page.locator('button:has-text("Gastos"), a:has-text("Gastos"), .sidebar-item:has-text("Gastos")').first();
    await gastosNav.click();
    await page.waitForTimeout(1800);

    // 3️⃣ Abrir Modal de Registro de Gasto
    console.log('3️⃣ Abriendo modal de registro de gasto...');
    const registrarBtn = page.locator('button:has-text("Registrar Gasto")').first();
    await registrarBtn.click();
    await page.waitForTimeout(1000);

    // 4️⃣ Llenar gasto de prueba de alto riesgo: RD$ 26,000
    console.log('4️⃣ Llenando formulario con RD$ 26,000 (Fricción de Alto Riesgo)...');
    await page.fill('input[placeholder*="Supermercado"], input[placeholder*="Descripción"], .modal-input[type="text"]', 'Laptop de Trabajo AUREUS');
    await page.fill('input[type="number"]', '26000');
    await page.waitForTimeout(800);

    // 5️⃣ Enviar formulario para activar Fricción Intencional
    console.log('5️⃣ Pulsando Guardar Gasto...');
    const guardarBtn = page.locator('.modal-footer button:has-text("Guardar Gasto"), button[type="submit"]:has-text("Guardar Gasto")').first();
    await guardarBtn.click();
    await page.waitForTimeout(800);

    // 6️⃣ Verificar TransactionConfirmationFlow
    console.log('6️⃣ Verificando TransactionConfirmationFlow...');
    const confirmationOverlay = page.locator('.transaction-confirmation-overlay');
    await confirmationOverlay.waitFor({ state: 'visible', timeout: 5000 });
    console.log('🌟 Modal de Fricción de Seguridad AUREUS VISIBLE');

    // Screenshot 2: Modal de Fricción con $26,000
    const snapFriction = path.join(ARTIFACT_DIR, 'e2e_friction_step.png');
    await page.screenshot({ path: snapFriction });
    console.log('📸 Captura 2 guardada:', snapFriction);

    // Esperar a que el micro-delay (350ms) active el botón de autorización
    const authBtn = page.locator('.btn-confirm-transaction');
    await authBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(600);

    // 7️⃣ Autorizar la transacción para ver el Sello Dorado
    console.log('7️⃣ Confirmando autorización para estampar el Sello Dorado...');
    await authBtn.click();

    // Esperar al sello dorado
    const seal = page.locator('.transaction-seal');
    await seal.waitFor({ state: 'visible', timeout: 3000 });
    console.log('🏅 Sello Dorado AUREUS 360° ACTIVO y girando');

    // Screenshot 3: Sello Dorado
    const snapSeal = path.join(ARTIFACT_DIR, 'e2e_golden_seal.png');
    await page.screenshot({ path: snapSeal });
    console.log('📸 Captura 3 guardada:', snapSeal);

    // Esperar a que concluya la animación del sello y cierre
    await page.waitForTimeout(2000);

    // 8️⃣ Probar transición de módulo y Splash Screen estilo Stripe
    console.log('8️⃣ Probando Splash Screen estilo Stripe navegando a Tarjetas...');
    const creditNav = page.locator('button:has-text("Tarjetas"), .sidebar-item:has-text("Tarjetas")').first();
    await creditNav.click();
    
    // Captura durante el splash si está visible
    await page.waitForTimeout(300);
    const snapSplash = path.join(ARTIFACT_DIR, 'e2e_splash_loader.png');
    await page.screenshot({ path: snapSplash });
    console.log('📸 Captura 4 guardada:', snapSplash);

    await page.waitForTimeout(2000);
    console.log('🎉 Todas las verificaciones de seguridad e interacción completadas con éxito.');
  } catch (err) {
    console.error('❌ Error durante la prueba E2E:', err);
  } finally {
    console.log('Cerrando navegador...');
    await browser.close();
  }
})();
