const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('SiteSetting', SiteSettingSchema); 