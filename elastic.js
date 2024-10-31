import { Client } from '@elastic/elasticsearch'
const client = new Client({
  node: 'https://elastic:Etrkw9q18sZPMVBOk7HaJBJ3@5beba579c084479cbf98d8bf429a5114.us-east-1.aws.found.io:9243/'
})

const getLogs = async () => {
    try {
        const search = await client.search({
            query: {
              match: {
                fluxo: 'vida_renner'
              }
            }
          })
    
          console.log('KKKKKKKKKKKKKKKKKK', search)
    } catch (error) {
        console.log(`Error: ${error}` )
    }
    
}

getLogs();



1,810,265,805


