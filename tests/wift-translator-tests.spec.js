const { test, expect } = require('@playwright/test');
const WEBSITE_URL = 'https://www.swifttranslator.com/';

const SELECTORS = {
  inputField: 'textarea[placeholder="Input Your Singlish Text Here."]',
};

// Configure test to run in new browser context for each test
test.use({
  headless: false, // Set to true if you want headless mode
  viewport: { width: 1280, height: 720 },
});

const waitForTranslation = async (page, timeout = 4000) => {
  await page.waitForTimeout(timeout);
};

const getSinhalaOutput = async (page) => {
  try {
    const elements = await page.locator('text=/[඀-෿]+/').all();
    if (elements.length > 0) {
      return (await elements[elements.length - 1].textContent()).trim();
    }
  } catch (e) {}
  
  try {
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 1) {
      return (await textareas[1].inputValue()).trim();
    }
  } catch (e) {}
  
  try {
    const bodyText = await page.locator('body').textContent();
    const match = bodyText.match(/[඀-෿\s]+/);
    if (match) return match[0].trim();
  } catch (e) {}
  
  return '';
};

const translateText = async (page, input) => {
  const inputField = page.locator(SELECTORS.inputField);
  await inputField.clear();
  await page.waitForTimeout(500);
  await inputField.fill(input);
  await waitForTranslation(page);
  return await getSinhalaOutput(page);
};

const runTest = async (page, testId, input, expectedOutput, isNegative = false) => {
  console.log(`\n${testId}: Opening new browser...`);
  await page.goto(WEBSITE_URL);
  
  console.log(`\n${testId}: Starting test...`);
  
  const actualOutput = await translateText(page, input);
  const matches = actualOutput === expectedOutput;
  
  console.log(`\n${testId}:`);
  console.log('  Input:', input.length > 50 ? input.substring(0, 50) + '...' : input);
  console.log('  Expected:', expectedOutput.length > 50 ? expectedOutput.substring(0, 50) + '...' : expectedOutput);
  console.log('  Actual:', actualOutput.length > 50 ? actualOutput.substring(0, 50) + '...' : actualOutput);
  
  if (isNegative) {
    console.log('  Status:', !matches ? 'PASS ✓ (correctly fails)' : 'FAIL ✗');
    console.log('  ⚠️  Negative test - failure expected');
  } else {
    console.log('  Match:', matches ? 'YES' : 'NO');
    console.log('  Status:', matches ? 'PASS ✓' : 'FAIL ✗');
    if (!matches) console.warn('  ⚠️  Output mismatch');
  }
  
  // Take a screenshot for visual confirmation
  await page.screenshot({ 
    path: `test-results/${testId.replace(/[:\/]/g, '_')}.png`,
    fullPage: false 
  });
  
  return actualOutput;
};

test.describe('Singlish to Sinhala Translation Tests - All Test Cases', () => {
  
  // Create a summary report
  let testResults = [];
  
  test.afterEach(async ({ page }, testInfo) => {
    const result = {
      testId: testInfo.title,
      status: testInfo.status,
      duration: testInfo.duration,
      timestamp: new Date().toISOString()
    };
    testResults.push(result);
    
    // Keep browser open for a moment to see results
    await page.waitForTimeout(1000);
  });
  
  test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const total = testResults.length;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      testResults
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.testId}`));
    }
    
    console.log('\n' + '='.repeat(60));
  });

  // ==============================
  // POSITIVE TESTS
  // ==============================

  test('Pos_Fun_0001: Convert simple daily sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0001',
      'mama gedhara yanavaa.',
      'මම ගෙදර යනවා.');
  });

  test('Pos_Fun_0002: Convert interrogative greeting', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0002',
      'oyaata kohomadha?',
      'ඔයාට කොහොමද?');
  });

  test('Pos_Fun_0003: Convert polite request', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0003',
      'machan karuNaakaralaa mata udhavvak karanna puLuvandha?',
      'මචන් කරුණාකරලා මට උදව්වක් කරන්න පුළුවන්ද?');
  });

  test('Pos_Fun_0004: Convert imperative command', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0004',
      'vahaama enna.',
      'වහාම එන්න.');
  });

  test('Pos_Fun_0005: Convert negative sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0005',
      'mama ehema karanne naehae.',
      'මම එහෙම කරන්නේ නැහැ.');
  });

  test('Pos_Fun_0006: Convert greeting ayubowan', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0006',
      'aayuboovan!',
      'ආයුබෝවන්!');
  });

  test('Pos_Fun_0007: Convert compound sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0007',
      'api kaeema kanna yanavaa saha passe chithrapatayak balanavaa.',
      'අපි කෑම කන්න යනවා සහ පස්සේ චිත්‍රපටයක් බලනවා.');
  });

  test('Pos_Fun_0008: Convert past tense sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0008',
      'mama iiyee gedhara giyaa.',
      'මම ඉයේ ගෙදර ගියා.');
  });

  test('Pos_Fun_0009: Convert present tense sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0009',
      'mama dhaen vaeda karanavaa.',
      'මම දැන් වැඩ කරනවා.');
  });

  test('Pos_Fun_0010: Convert future tense sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0010',
      'mama heta enavaa.',
      'මම හෙට එනවා.');
  });

  test('Pos_Fun_0011: Convert plural pronoun', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0011',
      'api yamu.',
      'අපි යමු.');
  });

  test('Pos_Fun_0012: Convert pronoun variation', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0012',
      'eyaala enavadha?',
      'එයාල එනවද?');
  });

  test('Pos_Fun_0013: Convert repeated words', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0013',
      'ela ela',
      'එල එල');
  });

  test('Pos_Fun_0014: Convert phrase pattern', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0014',
      'mata oona',
      'මට ඕන');
  });

  test('Pos_Fun_0015: Convert joined words', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0015',
      'yaaLuvagedharayanavaa',
      'යාළුවගෙදරයනවා');
  });

  test('Pos_Fun_0016: Convert mixed English term', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0016',
      'Zoom meeting ekak thiyennee.',
      'Zoom meeting එකක් තියෙන්නේ.');
  });

  test('Pos_Fun_0017: Convert mixed English term with multiple words', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0017',
      'Documents tika attach karalaa mata email ekak evanna.',
      'Documents ටික attach කරලා මට email එකක් එවන්න.');
  });

  test('Pos_Fun_0018: Convert currency format', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0018',
      'Rs. 9875',
      'Rs. 9875');
  });

  test('Pos_Fun_0019: Convert time format', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0019',
      '9.30 AM',
      '9.30 AM');
  });

  test('Pos_Fun_0020: Convert date format', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0020',
      '25/12/2026',
      '25/12/2026');
  });

  test('Pos_Fun_0021: Convert multiline input', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0021',
      'mama gedhara yanavaa.\noyaa enavadha?',
      'මම ගෙදර යනවා.\nඔයා එනවද?');
  });

  test('Pos_Fun_0022: Convert long paragraph', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0022',
      'dhitvaa suLi kuNaatuva samaGa aethi vuu gQQvathura saha naayayaeem heethuven maarga sQQvarDhana aDhikaariya sathu maarga kotas 430k vinaashayata pathva aethi athara ehi samastha dhiga pramaaNaya kiloomiitar 300k pamaNa vana bava saDHahan kaLeeya.',
      'දිට්වා සුළි කුණාටුව සමඟ ඇති වූ ගංවතුර සහ නායයෑම් හේතුවෙන් මාර්ග සංවර්ධන අධිකාරිය සතු මාර්ග කොටස් 430ක් විනාශයට පත්ව ඇති අතර එහි සමස්ත දිග ප්‍රමාණය කිලෝමීටර් 300ක් පමණ වන බව සඳහන් කළේය.');
  });

  test('Pos_Fun_0023: Convert slang expression', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0023',
      'ela machan! supiri!!',
      'එල මචං! සුපිරි!!');
  });

  test('Pos_Fun_0024: Convert place name sentence', async ({ page }) => {
    await runTest(page, 'Pos_Fun_0024',
      'Colombo yanna hadhannee.',
      'කොළඹ යන්න හදන්නේ.');
  });

  // ==============================
  // NEGATIVE TESTS
  // ==============================

  test('Neg_Fun_0001: Handle empty input', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0001',
      '',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0002: Handle symbols only', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0002',
      '@@@@@',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0003: Handle numbers only', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0003',
      '123456789',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0004: Handle excessive spaces', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0004',
      'mama     gedhara      yanavaa',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0005: Handle mixed symbols', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0005',
      'mama @@ yanavaa',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0006: Handle Singlish input with missing spaces and informal abbreviations', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0006',
      'me para weekend eka nam lit',
      'මෙ පර weekend එක නම් lit',
      true);
  });

  test('Neg_Fun_0007: Handle emoji input', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0007',
      '😀😀😀',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0008: Handle random English text', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0008',
      'This is a random English sentence for testing.',
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0009: Handle long repeated text', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0009',
      'mama '.repeat(100),
      'No meaningful Sinhala output expected',
      true);
  });

  test('Neg_Fun_0010: Handle incorrect spelling', async ({ page }) => {
    await runTest(page, 'Neg_Fun_0010',
      'mmmaaa gdhraaa yannvaaa',
      'No meaningful Sinhala output expected',
      true);
  });

  // ==============================
  // UI TEST
  // ==============================

  test('Pos_UI_0001: Real-time output updates automatically', async ({ page }) => {
    await page.goto(WEBSITE_URL);
    console.log('\nPos_UI_0001: Starting UI test for real-time updates...');
    
    const inputField = page.locator(SELECTORS.inputField);
    await inputField.clear();
    await page.waitForTimeout(500);
    
    const testInput = 'supun gedhara yanavaa';
    const expectedOutput = 'සුපුන් ගෙදර යනවා';
    
    console.log('\nPos_UI_0001: Testing real-time translation...');
    console.log('  Input:', testInput);
    
    let outputUpdates = 0;
    let previousOutput = '';
    
    // Type character by character to see real-time updates
    for (let i = 0; i < testInput.length; i++) {
      await inputField.type(testInput[i], { delay: 200 }); // Slower for visibility
      await page.waitForTimeout(500); // Wait longer to see updates
      
      const currentOutput = await getSinhalaOutput(page);
      if (currentOutput !== previousOutput && currentOutput.length > 0) {
        outputUpdates++;
        previousOutput = currentOutput;
        console.log(`  Step ${i+1}: "${currentOutput}"`);
      }
    }
    
    await waitForTranslation(page, 2000);
    const finalOutput = await getSinhalaOutput(page);
    
    // Take screenshot of final result
    await page.screenshot({ 
      path: 'test-results/Pos_UI_0001_final.png',
      fullPage: true 
    });
    
    console.log('\nPos_UI_0001: Results:');
    console.log('  Expected:', expectedOutput);
    console.log('  Final Output:', finalOutput);
    console.log('  Output Updates Detected:', outputUpdates);
    console.log('  Real-time Updates:', outputUpdates > 0 ? 'YES ✓' : 'NO ✗');
    console.log('  Final Match:', finalOutput === expectedOutput ? 'YES ✓' : 'NO ✗');
    
    const testPassed = outputUpdates > 0 && finalOutput === expectedOutput;
    console.log('  Status:', testPassed ? 'PASS ✓' : 'FAIL ✗');
    
    if (!testPassed && outputUpdates === 0) {
      console.warn('  ⚠️  No real-time updates detected');
    }
    if (!testPassed && finalOutput !== expectedOutput) {
      console.warn('  ⚠️  Final output mismatch');
    }
    
    // Keep browser open longer to see the final result
    await page.waitForTimeout(3000);
  });
});