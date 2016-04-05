'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClassSchema = new Schema({
  semester: String,
  current: false,
  displayURP:{
    type: Boolean,
    default: false
  },
  mentors: [{
    type : Schema.Types.ObjectId,
    ref: 'User'
  }],
  students: [{
    type : Schema.Types.ObjectId,
    ref: 'User'
  }],
  projects: [{
    type : Schema.Types.ObjectId,
    ref: 'Project'
  }],
  dayCodes: [{
    date:Date,
    code:String,
    bonusDay:{
      type:Boolean,
      default:false
    }
  }]
});

/*
	Virtuals
*/
ClassSchema
	.virtual("dayCode")
	.get(function(){
		var today = new Date();
		today.setHours(0,0,0,0);
		for (var i = 0;i < this.dayCodes.length;i++){
			if (this.dayCodes[i].date.getTime() == today.getTime()){
				return this.dayCodes[i].code;
			}
		}
		return null;
	});

var ClassYear;
ClassSchema.statics.getCurrent = function(cb){
	ClassYear.findOne({
		"current": true
	}, function(err, classYear){
		cb(err, classYear);
	});
};

ClassSchema
	.virtual("dayCodeInfo")
	.get(function(){
		var today = new Date();
		today.setHours(0,0,0,0);
		for (var i = 0;i < this.dayCodes.length;i++){
			if (this.dayCodes[i].date.getTime() === today.getTime()){
				return this.dayCodes[i];
			}
		}
		return null;
	});

ClassSchema
.virtual("days")
.get(function(){
  var total = this.dayCodes.reduce(function(previousValue, currentValue, index, array) {
    return previousValue + (currentValue.bonusDay? 0 : 1);
  }, 0) ;
  return total;
});

ClassSchema
  .virtual("bonusDays")
  .get(function(){
    var total = this.dayCodes.reduce(function(previousValue, currentValue, index, array) {
      return previousValue + (currentValue.bonusDay? 1 : 0);
    }, 0) ;
    return total;
  });

ClassSchema
  .virtual("dates")
  .get(function(){
    var all = this.dayCodes.filter(function(value) {
      return !value.bonusDay;
    })
    .map(function(value) {
      return value.date;
    });
    return all;
  });

ClassSchema
  .virtual("bonusDates")
  .get(function(){
    var all = this.dayCodes.filter(function(value) {
      return value.bonusDay;
    })
    .map(function(value) {
      return value.date;
    });
    return all;
  });

ClassYear = mongoose.model('ClassYear', ClassSchema);
module.exports = ClassYear;

ClassYear.getCurrent(function(err, currentClassYear){
    global.currentClassYear = currentClassYear;
});
