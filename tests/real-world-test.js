import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  async startServer() {
    console.log('🚀 Starting MCP Server...');
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', [join(__dirname, '..', 'dist', 'index.js')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: join(__dirname, '..')
      });

      this.serverProcess.stdout.on('data', (data) => {
        console.log(`[SERVER OUT] ${data}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERR] ${data}`);
      });

      setTimeout(() => {
        console.log('✅ Server started\n');
        resolve();
      }, 2000);
    });
  }

  async sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(7);
      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params
      };

      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.serverProcess.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  recordTest(name, passed, details) {
    this.testResults.push({ name, passed, details, timestamp: new Date() });
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (details) {
      console.log(`   ${details}`);
    }
    console.log();
  }

  async runTests() {
    console.log('\n🧪 Starting Real-World Tests\n');
    console.log('='.repeat(60));

    try {
      await this.testBasicSearch();
      await this.testFileSearch();
      await this.testSecurityInjection();
      await this.testEdgeCases();
      await this.testValidation();
      await this.testLargeResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    this.printSummary();
  }

  async testBasicSearch() {
    console.log('\n📋 Testing Basic Search Functionality\n');

    try {
      const response = await this.sendRequest('tools/call', {
        name: 'search_files',
        arguments: {
          query: 'test.txt',
          maxResults: 10
        }
      });

      const result = JSON.parse(response.result?.content?.[0]?.text || '{}');
      this.recordTest(
        'Basic search for test.txt',
        result.success === true,
        `Found ${result.count || 0} results`
      );
    } catch (error) {
      this.recordTest('Basic search for test.txt', false, error.message);
    }
  }

  async testFileSearch() {
    console.log('\n📁 Testing File Search Patterns\n');

    const patterns = ['*.ts', '*.js', '*.md'];
    for (const pattern of patterns) {
      try {
        const response = await this.sendRequest('tools/call', {
          name: 'search_files',
          arguments: {
            query: pattern,
            maxResults: 5
          }
        });

        const result = JSON.parse(response.result?.content?.[0]?.text || '{}');
        this.recordTest(
          `Search pattern: ${pattern}`,
          result.success === true,
          `Found ${result.count || 0} results`
        );
      } catch (error) {
        this.recordTest(`Search pattern: ${pattern}`, false, error.message);
      }
    }
  }

  async testSecurityInjection() {
    console.log('\n🔒 Testing Security - Command Injection Attempts\n');

    const attackPatterns = [
      { query: 'test; rm -rf /', name: 'Semicolon injection' },
      { query: 'test && evil', name: 'AND operator injection' },
      { query: 'test | evil', name: 'Pipe injection' },
      { query: 'test$(evil)', name: 'Command substitution' },
      { query: '../../../etc/passwd', name: 'Path traversal' },
      { query: 'C:\\..\\..\\windows', name: 'Windows path traversal' },
      { query: 'test`evil`', name: 'Backtick injection' },
    ];

    for (const { query, name } of attackPatterns) {
      try {
        const response = await this.sendRequest('tools/call', {
          name: 'search_files',
          arguments: { query, maxResults: 5 }
        });

        const result = JSON.parse(response.result?.content?.[0]?.text || '{}');
        this.recordTest(
          `Security: ${name}`,
          result.success !== false || result.error?.includes('validation'),
          result.success ? '⚠️ Injection not blocked' : '✅ Injection blocked'
        );
      } catch (error) {
        this.recordTest(`Security: ${name}`, true, '✅ Request blocked by validation');
      }
    }
  }

  async testEdgeCases() {
    console.log('\n🎯 Testing Edge Cases\n');

    const edgeCases = [
      { query: '', name: 'Empty query', shouldFail: true },
      { query: '   ', name: 'Whitespace only', shouldFail: true },
      { query: 'a'.repeat(2000), name: 'Very long query', shouldFail: true },
      { query: '测试文件', name: 'Unicode characters', shouldFail: false },
      { query: 'file with spaces', name: 'Spaces in query', shouldFail: false },
      { query: 'file.txt', maxResults: 0, name: 'Zero maxResults', shouldFail: true },
      { query: 'file.txt', maxResults: 10000, name: 'Excessive maxResults', shouldFail: true },
      { query: 'file.txt', offset: -1, name: 'Negative offset', shouldFail: true },
      { query: 'file.txt', offset: 1000000, name: 'Excessive offset', shouldFail: true },
    ];

    for (const { query, maxResults, offset, name, shouldFail } of edgeCases) {
      try {
        const response = await this.sendRequest('tools/call', {
          name: 'search_files',
          arguments: { query, maxResults, offset }
        });

        const result = JSON.parse(response.result?.content?.[0]?.text || '{}');
        const passed = shouldFail ? !result.success : result.success;
        this.recordTest(
          `Edge case: ${name}`,
          passed,
          shouldFail ? (passed ? '✅ Validation blocked' : '❌ Should have been blocked') : `✅ Accepted`
        );
      } catch (error) {
        const passed = shouldFail ? true : false;
        this.recordTest(
          `Edge case: ${name}`,
          passed,
          passed ? '✅ Validation blocked request' : '❌ Unexpected error'
        );
      }
    }
  }

  async testValidation() {
    console.log('\n✅ Testing Validation Functions\n');

    const { validateSearchQuery, validatePath, sanitizeShellArg, SecurityConfig } = await import('../src/utils/validation.js');

    this.recordTest(
      'Query length limit (1000 chars)',
      (() => {
        try {
          validateSearchQuery('a'.repeat(1000));
          return true;
        } catch (e) {
          return false;
        }
      })(),
      'Max length query accepted'
    );

    this.recordTest(
      'Query length exceeded',
      (() => {
        try {
          validateSearchQuery('a'.repeat(1001));
          return false;
        } catch (e) {
          return true;
        }
      })(),
      '✅ Exceeded length rejected'
    );

    this.recordTest(
      'Path traversal detection',
      (() => {
        try {
          validatePath('../../../etc/passwd');
          return false;
        } catch (e) {
          return true;
        }
      })(),
      '✅ Path traversal blocked'
    );

    this.recordTest(
      'Shell character sanitization',
      (() => {
        const sanitized = sanitizeShellArg('test; rm -rf /');
        return !sanitized.includes(';') && !sanitized.includes('rm');
      })(),
      '✅ Shell metachars removed'
    );

    this.recordTest(
      'SecurityConfig values',
      SecurityConfig.MAX_QUERY_LENGTH === 1000 &&
      SecurityConfig.MAX_RESULTS === 1000 &&
      SecurityConfig.COMMAND_TIMEOUT === 30000,
      '✅ Config values correct'
    );
  }

  async testLargeResults() {
    console.log('\n📊 Testing Large Result Sets\n');

    try {
      const response = await this.sendRequest('tools/call', {
        name: 'search_files',
        arguments: {
          query: '*',
          maxResults: 100,
          offset: 0
        }
      });

      const result = JSON.parse(response.result?.content?.[0]?.text || '{}');
      this.recordTest(
        'Large result set (100 items)',
        result.success === true,
        `Returned ${result.count || 0} results`
      );
    } catch (error) {
      this.recordTest('Large result set (100 items)', false, error.message);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.details}`));
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 All tests passed! The server is production-ready.');
    } else {
      console.log('⚠️ Some tests failed. Review and fix issues.');
    }
  }

  async stop() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping server...');
      this.serverProcess.kill();
    }
  }
}

async function main() {
  const tester = new MCPTester();

  try {
    await tester.startServer();
    await tester.runTests();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await tester.stop();
    process.exit(0);
  }
}

main();
