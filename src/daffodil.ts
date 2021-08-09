export const infosetEvent = 'daffodil.infoset';
export interface InfosetEvent {        
    content: string;
    
    /** Default to returning the full infoset XML, but enable other encodings like diffs in the future. */
    mimeType: 'text/xml' | string;
}
