import React, { useState } from 'react';

export default function TestWebhook() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // 模拟 Stripe webhook 事件
      const mockEvent = {
        id: "evt_test_webhook",
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            object: "checkout.session",
            amount_total: 2999,
            currency: "usd",
            customer: "cus_test_123",
            payment_status: "paid",
            metadata: {
              supabase_user_id: "test-user-123",
              plan_name: "basic"
            }
          }
        }
      };

      const response = await fetch(
        'https://mgbftnkxmbasanzfdpax.supabase.co/functions/v1/server/make-server-604ca09d/stripe-webhook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 't=1234567890,v1=test_signature'
          },
          body: JSON.stringify(mockEvent)
        }
      );

      const data = await response.json();
      setResult({
        status: response.status,
        data
      });
    } catch (error: any) {
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stripe Webhook 测试</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试端点</h2>
          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm break-all">
            https://mgbftnkxmbasanzfdpax.supabase.co/functions/v1/make-server-604ca09d/stripe-webhook
          </div>
          
          <button
            onClick={testWebhook}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '测试中...' : '发送测试 Webhook'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              {result.error ? '❌ 错误' : '✅ 响应'}
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📝 在 Stripe 中配置</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. 访问 <a href="https://dashboard.stripe.com/test/webhooks" target="_blank" rel="noopener noreferrer" className="underline">Stripe Webhooks</a></li>
            <li>2. 点击 "Add endpoint"</li>
            <li>3. 输入上面的 URL</li>
            <li>4. 选择要监听的事件</li>
            <li>5. 点击 "Send test webhook" 发送测试</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">🔍 查看日志</h3>
          <p className="text-sm text-green-800">
            访问 <a 
              href="https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax/functions/server/logs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              Supabase 日志
            </a> 查看接收到的事件
          </p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-3">🔗 或使用 webhook.site</h3>
          <p className="text-sm text-amber-800 mb-2">
            如果您想先查看 Stripe 发送的原始数据，可以使用：
          </p>
          <div className="bg-white p-3 rounded font-mono text-sm break-all border border-amber-300">
            https://webhook.site/ddd868c1-fdcf-4fcf-8b87-7e70f659e057
          </div>
        </div>
      </div>
    </div>
  );
}