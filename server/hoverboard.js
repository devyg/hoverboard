Meteor.publish('events', function() {
	if (this.userId) {
		return Events.find({userId: this.userId});
	}

	this.stop();
});

Meteor.publish('shows', function() {
	if (this.userId) {
		return Shows.find({userId: this.userId});
	}

	this.stop();
});

Meteor.methods({
});

Meteor.startup(function () {
});
