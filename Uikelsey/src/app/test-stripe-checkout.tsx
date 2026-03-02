import React, { useState } from 'react';

export default function TestStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createCheckoutSession = async () => {
    setLoading(true);
    setResult(null);

    try {
      // TODO: 需要先创建 Stripe Checkout Session 的服务器端点
      alert('需要先配置 Stripe Secret Key 和创建 Checkout Session 端点');
      
      // 示例代码：
      /*
      const response = await fetch(
        'https://mgbftnkxmbasanzfdpax.supabase.co/functions/v1/make-server-604ca09d/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: 'price_xxx', // 您的 Stripe Price ID
            successUrl: window.location.origin + '/success',
            cancelUrl: window.location.origin + '/cancel',
          })
        }
      );
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // 重定向到 Stripe Checkout
      }
      */
      
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">测试真实的 Stripe Checkout</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">创建测试支付</h2>
          <p className="text-gray-600 mb-4">
            这会创建一个真实的 Stripe Checkout Session，完成支付后会触发真实的 webhook 事件。
          </p>
          
          <button
            onClick={createCheckoutSession}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '创建中...' : '创建 Checkout Session'}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-3">⚠️ 注意</h3>
          <p className="text-sm text-amber-800 mb-3">
            这个功能需要：
          </p>
          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
            <li>配置 STRIPE_SECRET_KEY 环境变量</li>
            <li>在服务器中创建 /create-checkout 端点</li>
            <li>配置 Stripe Price ID</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">💡 更简单的测试方法</h3>
          <p className="text-sm text-green-800 mb-3">
            在浏览器控制台输入：
          </p>
          <div className="bg-white p-3 rounded font-mono text-sm border border-green-300">
            window.testWebhook()
          </div>
          <p className="text-sm text-green-800 mt-2">
            然后点击 "发送测试 Webhook" 按钮，这样可以直接测试 webhook 端点！
          </p>
        </div>
      </div>
    </div>
  );
}
