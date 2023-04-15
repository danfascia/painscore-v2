import PocketBase from 'pocketbase';

const pb = new PocketBase('https://painscore.pockethost.io');

export const post = async ({request})=> {
    const data = await request.formData() // Here's the data sent by the form
    
    let schedule = [1,2,3,4,5,6,7,14,21,28,35,42] // pain diary schedule can be changed (in days)
    
    let newCase = {}
    let caseRecord
    let done

    newCase.datetime = new Date(data.get('datetime')) // Here's how you get the value of a field
    newCase.patient_email = data.get('patient_email')
    newCase.referrer_email = data.get('referrer_email')
    newCase.side = data.get('side')
    newCase.intervention_description = data.get('intervention_description')
    newCase.entries = []
    newCase.completed = false

    async function createAsyncEntries() {

        let entries = []

        for await (const entry of schedule) {
            const data = {}
            let record
            
            data.notification_ts = new Date(Number(newCase.datetime))
            data.notification_ts.setDate(data.notification_ts.getDate() + entry)
           
            try {
                record = await pb.collection('entries').create(data, { '$autoCancel': false })
                entries.push(record.id)
            }
            catch (err) {
                console.error(err)
            }
        }

        return entries
    }

    async function createCase(entries) {
        newCase.entries = entries        
        try {
            const record = await pb.collection('cases').create(newCase, { '$autoCancel': false })
            console.log(record)
            return record
        } catch (err) {
            console.error(err)
        }
    }

    await createAsyncEntries().then( (entries) => {createCase(entries)} ).finally((record) => {
        return new Response( JSON.stringify(record), { status: 200 })
    })

  }