const MongoClient = require('mongodb').MongoClient
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')
const fs = require('fs')

const main = () => {
	const commandLineOptions = [
		{
			name: 'uri',
			type: String,
			mandatory: true,
			description: `[MANDATORY] Set the connection URI of the database`,
		},
		{
			name: 'update',
			alias: 'u',
			type: Boolean,
			description: `Execute the update query to modify the matched documents`,
		},
		{
			name: 'test',
			alias: 't',
			type: Boolean,
			description: `Execute the script against the 'test' database instead of 'bativigie'`,
		},
		{
			name: 'copy',
			alias: 'c',
			type: Boolean,
			description: `If --test is set, copy the 'workers' collection from 'bativigie' to 'test' before`,
		},
		{
			name: 'help',
			alias: 'h',
			type: Boolean,
			description: `Show this usage manual`,
		},
	]
	const options = commandLineArgs(commandLineOptions)

	if (options.help) {
		const usage = commandLineUsage([
			{
				header: `Bativigie workers status update script`,
				content: `This script allows you to connect to the 'bativigie' mongoDB collection in order to list and update the 'status' of all workers of type 'interim' whose contract has already ended.`,
			},
			{
				header: 'Options',
				optionList: commandLineOptions.map(
					({ name, type, description, alias }) => ({
						name: `${name}${alias ? ` -${alias}` : ''}`,
						description,
						typeLabel: `{underline ${type.name}}`,
					}),
				),
			},
		])
		console.log(usage)
		return
	}

	const logsFolder = './.logs'
	const prodDbName = 'bativigie'
	const testDbName = 'test'
	const dbName = options.test ? testDbName : prodDbName
	const collectionName = 'workers'
	const keepAliveIntervalId = setInterval(() => {}, 1 << 30)

	if (!options.uri) {
		console.log('Please, provide a valid mongo URI as argument.')
	} else {
		console.log('Connecting to mongo...')

		MongoClient.connect(
			options.uri,
			{ useUnifiedTopology: true },
			async (error, client) => {
				if (error) {
					console.log('[ERROR]', error)
					client.close()
					clearInterval(keepAliveIntervalId)
					return
				}

				console.log(
					`Connection established to the "${dbName}" database`,
				)

				const now = Date.now()
				const selector = {
					'contract.kind': 'interim',
					'contract.end_at': { $exists: true, $lte: now },
					status: { $ne: 'refused' },
				}

				if (options.test && options.copy) {
					console.log('Preparing copy operation')

					try {
						const prodDbWorkers = client
							.db(prodDbName)
							.collection(collectionName)
						const testDbWorkers = client
							.db(testDbName)
							.collection(collectionName)

						console.log(
							`Droping all existing data from 'test.workers'...`,
						)

						testDbWorkers.drop()

						const workersToCopy = await prodDbWorkers
							.find(selector, {
								projection: { _id: 1, contract: 1, status: 1 },
							})
							.toArray()

						console.log(
							`Copying ${workersToCopy.length} matching "bativigie.workers" into "test.workers"...`,
						)

						await testDbWorkers.insertMany(workersToCopy)

						console.log('Copy done.')
					} catch (error) {}
				}

				const db = client.db(dbName)
				const workers = db.collection(collectionName)

				const workersToModify = await workers
					.find(selector, { projection: { _id: 1 } })
					.toArray()
				const idsToModify = workersToModify.map((worker) => worker._id)

				let updateResult = 0
				let nbMatched = idsToModify.length

				console.log(
					`Searching interim workers where contract ended before :
                ${new Date(now)} (timestamp ${now})`,
				)
				console.log(`${nbMatched} documents to update found`)

				if (options.update === true) {
					console.log('Updating documents...')

					const session = client.startSession()
					const transactionOptions = {
						readPreference: 'primary',
						readConcern: { level: 'local' },
						writeConcern: { w: 'majority' },
					}

					try {
						await session.withTransaction(async () => {
							console.log('Transaction ongoing...')

							// Important:: You must pass the session to the operations
							const {
								matchedCount,
								modifiedCount,
							} = await workers.updateMany(
								{ _id: { $in: idsToModify } },
								{ $set: { status: 'refused' } },
								{ session },
							)

							updateResult = modifiedCount
							nbMatched = matchedCount
						}, transactionOptions)
					} catch (e) {
						console.log(
							'[ERROR] an error appeared during the transaction. \n Hence, no changes have been commited to the DB',
						)
						console.log(e)
					} finally {
						console.log(
							`${updateResult}/${nbMatched} documents updated`,
						)
						await session.endSession()
						await client.close()
					}
				}

				if (nbMatched) {
					if (!fs.existsSync(logsFolder)) {
						console.log('Creating logs folder...')
						fs.mkdirSync(logsFolder)
					}

					console.log('Adding log file...')
					fs.writeFileSync(
						`${__dirname}/.logs/.modified_ids_${now}${
							options.test ? '.test' : ''
						}.json`,
						JSON.stringify(idsToModify),
					)
				}

				console.log('Finished.')

				client.close()
				clearInterval(keepAliveIntervalId)
			},
		)
	}
}

module.exports = main

main()
