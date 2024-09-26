import { promises as fs } from 'fs';

export const readFileContent = async (filePath: string): Promise<string | null> => {
    try{
        return await fs.readFile(filePath, 'utf8')
    }catch(e){
        return null
    }
}

export const readJsonFileContent = async(filePath: string): Promise<any | null> => {
    const content = await readFileContent(filePath)
    if(content == null) return null

    try{
        return JSON.parse(content);
    }catch(e){
        return null
    }
}