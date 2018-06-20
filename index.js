var params = require('../../src/config/server.config');
var helper = require('./helper');
var qs = require('querystring')
var crypto = require('crypto');
var otherParams = {};

var config = {
        merchantId: '',
        workingKey: '',
        orderId: '',
        redirectUrl: '',
        orderAmount: ''
};

function setMerchant(mid) {
        config.merchantId = 44117;
}
function setWorkingKey(wk) {
        config.workingKey = 'F6C934E691BCF38227F02AAE9C6B1E8D';
}
function setOrderId(oi) {
        config.orderId = oi;
}
function setRedirectUrl(ru) {
        config.redirectUrl = ru;
}
function setOrderAmount(oa) {
        config.orderAmount = oa;
}

function setOtherParams(obj) {
        otherParams = obj;
}
function encrypt(plainText, workingKey){
        var m = crypto.createHash('md5');
        m.update(workingKey);
        var key = m.digest().slice(0, 16);
        var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
        var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
        var encoded = cipher.update(plainText,'utf8','hex');
        encoded += cipher.final('hex');
        return encoded;
}

function makePayment(res) {
	var errors = helper.checkRequiredField(config);
	if(errors.length > 0) {
			throw new Error(errors);
	}
	var req = '';
	req+= 'merchant_id='+config.merchantId+'&';
	req+= 'amount='+config.orderAmount+'&';
	req+= 'order_id='+config.orderId+'&';
	req+= 'currency=INR&';
	req+= 'language=en&';
	req+= 'redirect_url='+config.redirectUrl+'&';
	req+= 'cancel_url='+config.redirectUrl;
	req = encrypt(req, params.ccavenueWorkingKey);
	var body = "<form method='post' name='checkout' id='checkout' action='"+params.ccavenueURL+"'>" +
		"<input type=hidden id='encRequest' name='encRequest' value='" + req + "'>"
				+"<input type=hidden id='access_code' name='access_code' value='"+params.ccavenueAccessCode+"'>";
	body += "</form><script type='text/javascript'>" +
				"document.getElementById('checkout').submit();" +
			"</script>";
	res.writeHead(200, {
		'Content-Length': Buffer.byteLength(body),
		'Content-Type': 'text/html'
	});
	res.write(body);
	res.end();
}

function paymentRedirect(req) {
        var body = qs.parse(req.body);

    var ccString = helper.decrypt(body.encResponse, config.workingKey);
    var ccJson = qs.parse(ccString);

    ccString = config.merchantId + '|' + ccJson.Order_Id + '|' +
                 ccJson.Amount + '|' + ccJson.AuthDesc + '|' + config.workingKey;

    var Checksum = helper.genChecksum(ccString);
    ccJson.isCheckSumValid = helper.verifyChecksum(Checksum, ccJson.Checksum);

    return ccJson;
  }


module.exports = {
        setMerchant: setMerchant,
        setWorkingKey: setWorkingKey,
        setOrderId: setOrderId,
        setRedirectUrl: setRedirectUrl,
        setOrderAmount: setOrderAmount,
        setOtherParams: setOtherParams,
        makePayment: makePayment,
        paymentRedirect: paymentRedirect
};
