Shows = new Meteor.Collection('shows');

/*
_id
userId
field1
field2
eventId
*/

Shows.deny({
	insert: function(userId, doc) {
		return false;
	},

	update: function (userId, doc, fields, modifier) {
		// shows are not updatable
		return true;
	},

	remove: function(userId, doc) {
		return false;
	}
});

Shows.allow({
	insert: function (userId, doc) {
		check(
			doc, {
				_id: String,
				field1: String,
				field2: String,
				eventId: String,
				userId: String
		});
		return (userId && doc.userId == userId && Events.findOne({_id: doc.eventId, userId: userId}));
	},

	update: function (userId, doc, fields, modifier) {
		return false;
	},

	remove: function(userId, doc) {
		return (userId && doc.userId == userId)
	},

	fetch: ['userId']
});
