Events = new Meteor.Collection('events');

/*
_id
userId
date
*/

Events.deny({
	insert: function(userId, doc) {
		return false;
	},

	update: function (userId, doc, fields, modifier) {
		// events are not updatable
		return true;
	},

	remove: function(userId, doc) {
		// only removable with deleteEvent method
		return true;
	}
});

Events.allow({
	insert: function (userId, doc) {
		check(doc, {
			_id: String,
			userId: String,
			date: Date
		});
		
		return (userId && !Events.findOne({userId: userId, date: doc.date}));
	},

	update: function (userId, doc, fields, modifier) {
		return false;
	},

	remove: function(userId, doc) {
		//return (userId && doc.userId == userId)
		return false;
	},

	fetch: ['userId']
});

Meteor.methods({
	deleteEvent: function(eventId) {
		if(!this.userId)
			throw new Meteor.Error(403, 'Permission denied');

		if(!Events.findOne({_id: eventId}))
			throw new Meteor.Error(601, 'Event not found');

		Shows.remove({userId: this.userId, eventId: eventId});
		Events.remove({_id: eventId, userId: this.userId});
	}
})

if (Meteor.isServer) {
	//Events._ensureIndex('date', {unique: 1});
}
