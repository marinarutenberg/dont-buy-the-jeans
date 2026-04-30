// background.js — MV3 service worker
// Detects shopping sites and nudges the user via the action badge.

const SHOP_HOSTS = [
  'amazon.', 'zara.', 'asos.', 'nike.', 'uniqlo.', 'hm.com',
  'ebay.', 'etsy.', 'shopify.', 'target.com', 'walmart.',
  'bestbuy.', 'nordstrom.', 'farfetch.', 'ssense.',
  'revolve.', 'aritzia.', 'sephora.', 'shop.'
];

function isShoppingUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    return SHOP_HOSTS.some(h => host.includes(h));
  } catch (e) { return false; }
}

function updateBadge(tabId, url) {
  const on = isShoppingUrl(url);
  try {
    chrome.action.setBadgeBackgroundColor({ color: on ? '#c8170d' : '#00000000', tabId });
    chrome.action.setBadgeText({ text: on ? '!' : '', tabId });
    chrome.action.setTitle({
      title: on
        ? "don't buy the jeans. seriously."
        : "don't buy the jeans",
      tabId
    });
  } catch (e) {}
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateBadge(tabId, tab && tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    updateBadge(tabId, tab && tab.url);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#c8170d' });
});
