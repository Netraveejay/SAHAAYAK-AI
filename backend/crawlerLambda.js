const { runCrawler } = require('./services/crawlerService');

exports.handler = async (event) => {
  console.log('Crawler Lambda triggered');
  
  try {
    const results = await runCrawler();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Crawler completed',
        results
      })
    };
  } catch (error) {
    console.error('Crawler failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Crawler failed',
        message: error.message
      })
    };
  }
};
