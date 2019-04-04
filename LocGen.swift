#!/usr/bin/swift

import Foundation

extension Collection {
  subscript (safe index: Index) -> Element? {
    return indices.contains(index) ? self[index] : nil
  }
}

enum Token: String {
  case inputFilePath = "-i"
  case outputProjectPath = "-o"
}

func termsDefinitionsToString(_ inputArray: [(String, String)]) -> String {
  var stringBuffer = ""
  
  inputArray
    .map { key, value in return "\"\(key)\" = \"\(value)\";\n" }
    .forEach { termDefinition in stringBuffer.append(termDefinition) }
  
  return stringBuffer
}

func write(language: String, termsAndDefinitions: [(String, String)], baseDirURL: URL?) {
  let targetDirURL = (baseDirURL ?? FileManager.default.urls(for: .documentDirectory,
                                                             in: .userDomainMask).first!).appendingPathComponent(language + ".lproj")
  let resultURL = targetDirURL.appendingPathComponent("Localizable").appendingPathExtension("strings")
  let processedString = termsDefinitionsToString(termsAndDefinitions)
  try? FileManager.default.createDirectory(at: targetDirURL, withIntermediateDirectories: true, attributes: nil)
  try! processedString.data(using: .utf8)!.write(to: resultURL)
}

func main() {
  if CommandLine.arguments.count >= 3 {
    if let inputTokenIndex = CommandLine.arguments.firstIndex(of: Token.inputFilePath.rawValue),
      let filePath = CommandLine.arguments[safe: inputTokenIndex + 1] {
      let localizationFileURL = URL(fileURLWithPath: filePath)
      guard FileManager.default.fileExists(atPath: localizationFileURL.path) else {
        print("Input file does not exist ⛔️")
        return
      }
      
      let csvContents = try? String(contentsOf: localizationFileURL, encoding: .utf8)
        .components(separatedBy: "\n")
        .map { row in row
          .components(separatedBy: ",")
          .map { column in column.trimmingCharacters(in: .whitespacesAndNewlines) } }
      
      var container: [String: [(String, String)]] = [:]
      
      // process csvContents to fill container with structure [Language: [Term: Definition]]
      
      var columns: [[String]] = []
      
      for (rowIndex, _) in csvContents!.enumerated() {
        var col = [String]()
        for (_row) in csvContents! {
          if let item = _row[safe: rowIndex] {
            col.append(item)
          }
        }
        if !col.isEmpty {
          columns.append(col)
        }
      }
      
      for col in columns[1...] {
        let lang = col[0].lowercased()
        var terms = [(String, String)]()
        
        for translation in col[1...] {
          let idx = col.firstIndex(of: translation)!
          let term = columns[0][idx]
          terms.append((term, translation))
        }
        container[lang] = terms
      }
      
      let outputDirPath = CommandLine.arguments
        .firstIndex(of: Token.outputProjectPath.rawValue)
        .flatMap { CommandLine.arguments[safe: $0 + 1] }
        .map { URL(fileURLWithPath: $0, isDirectory: true) }
      
      container.forEach { (arg) in
        let (lang, terms) = arg
        write(language: lang, termsAndDefinitions: terms, baseDirURL: outputDirPath)
      }
    } else {
      print("Pass valid file url ⛔️")
    }
  } else {
    print("Invalid number arguments passed ⛔️")
  }
}

main()
